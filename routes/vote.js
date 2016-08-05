/**
 * Created by Chris on 3/11/2016.
 */
var express = require('express');
var router = express.Router();
var pg = require('pg');
var cache = require('../cache');
var log = require('../log');

var randInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

var arrayOfUniqueRandomIntegers = function(max, length) {
    var arr = [];

    for(var i = 0; i < length; ++i) {
        var newInt = randInt(1, max);
        while(arr.indexOf(newInt) > -1) {
            newInt = randInt(1, max);
        }
        arr.push(newInt);
    }

    return arr;
};

var getRandomCandidates = function (callback) {
    pg.connect(process.env.DATABASE_URL, function (err, client, done) {
        if(err) {
            return callback(err);
        }

        client.query("SELECT MAX(id) AS maxid FROM things", [], function(err, result) {
            if(err) {
                return callback(err);
            }

            var maxid = result.rows[0].maxid;
            var idList = arrayOfUniqueRandomIntegers(maxid, 5);

            client.query("SELECT things.id, things.name, pictures.filename, picture_credits.name AS photocredit, picture_credits.url " +
                "FROM things, pictures LEFT OUTER JOIN picture_credits ON (pictures.credit = picture_credits.id) " +
                "WHERE things.id = ANY($1::int[]) AND things.visibility >= 100 AND things.picture = pictures.id ORDER BY RANDOM() LIMIT 2",
                [idList], function(err, result) {
                done();

                if(err) {
                    return callback(err);
                }

                if(result.rows.length < 2) { //couldn't find two valid rows; try again
                    return getRandomCandidates(callback);
                }

                return callback(null, {
                    bucket: process.env.S3BUCKET,
                    candidates: [
                        {
                            name: result.rows[0].name,
                            picture: result.rows[0].filename,
                            id: result.rows[0].id,
                            photocredit: {
                                name: result.rows[0].photocredit,
                                url: result.rows[0].url
                            }
                        },
                        {
                            name: result.rows[1].name,
                            picture: result.rows[1].filename,
                            id: result.rows[1].id,
                            photocredit: {
                                name: result.rows[1].photocredit,
                                url: result.rows[1].url
                            }
                        }
                    ]
                });
            });
        });
    });
};

router.get('/', function(req, res, next) {
    getRandomCandidates(function (err, data) {
        if(err) {
            return next(err);
        }

        res.set('Cache-Control', 'no-Cache');

        res.json(data);
    })
});

router.post('/', function(req, res, next) {
    getRandomCandidates(function (err, data) {
        if(err) {
            return next(err);
        }

        var ballot = data;
        pg.connect(process.env.DATABASE_URL, function (err, client, done) {
            if(err) {
                return next(err);
            }

            client.query("SELECT id, name, elo, votes_for_or_against FROM things WHERE id IN ($1, $2) AND visibility >= 100", [req.body.id, req.body.opponent], function (err, result) {
                if(err) {
                    done();
                    return next(err);
                }

                if(result.rows.length !== 2) {
                    done();
                    return next(new Error("Could not find two things."));
                }

                //
                //***Calculate Elo sores***
                //
                //How Elo scoring works: https://metinmediamath.wordpress.com/2013/11/27/how-to-calculate-the-elo-rating-including-example/
                //Archive of this page: http://archive.is/ECkfz
                var winner, loser, transformedEloSum;
                if(req.body.id === result.rows[0].id) {
                    winner = result.rows[0];
                    loser = result.rows[1];
                } else {
                    winner = result.rows[1];
                    loser = result.rows[0];
                }
                winner.actual = 1;
                loser.actual = 0;
                //Find the transformed rating for both
                result.rows.forEach(function(thing) {thing.transformedElo = Math.pow(10, thing.elo/400)});
                //Find the expected score (probability of winning)
                transformedEloSum = winner.transformedElo + loser.transformedElo;
                result.rows.forEach(function(thing) {thing.expected = thing.transformedElo/transformedEloSum});
                //Convert probabilities to percentages for displaying to the user.
                //Creating a new array so that the winner is always first--the graph the user sees will have them in the same order.
                ballot.results = [winner, loser].map(function (thing) {
                    return {name: thing.name, score: Math.round(thing.expected * 100) + "%"};
                });
                ballot.voted = winner.name;

                res.json(ballot); //response sent

                //Everything after this point can be done after the results are sent to the user's browser.
                //Using a K-factor of 30 for items with 10 or fewer votes and K-factor of 20 for items with more.
                result.rows.forEach(function (thing) {
                    thing.newElo = thing.elo + Math.round((thing.votes_for_or_against < 10 ? 30 : 20) * (thing.actual - thing.expected));
                });

                client.query("UPDATE things SET elo = tmp.elo, votes_for_or_against = votes_for_or_against + 1 FROM (VALUES ($1::integer, $2::integer), ($3::integer, $4::integer)) AS tmp(id, elo) WHERE tmp.id = things.id", [loser.id, loser.newElo, winner.id, winner.newElo], function(err, result) {
                    if(err) {
                        done();
                        return console.error(err);
                    }

                    var logValues = {
                        headers: JSON.stringify(req.headers),
                        ipAddress: req.ip,
                        userId: req.user ? req.user.id : null,
                        winningThing: winner,
                        losingThing: loser
                    };

                    log.logVote(client, logValues, function (err, result) {

                        done();

                        if(err) {
                            return console.error(err);
                        }
                    });
                });
            });
        });
    });
});

router.post('/specify/', function (req, res, next) {
    cache.cachedMatchupInfo(req.body.thingNames[0], req.body.thingNames[1], function(err, result) {
        if(err) {
            return next(err);
        }

        if(!result) {
            //things not found; return 404 error
            return next();
        }

        res.json(result);
    });
});

module.exports = router;
