/**
 * Created by Chris on 5/6/2016.
 */

var express = require('express');
var router = express.Router();
var pg = require('pg');
var cache = require('../cache').cache;

router.get('/:username', function(req, res, next) {
    var cachedVal = cache.get("profile:" + req.params.username);

    if(cachedVal) {
        return res.json(JSON.parse(cachedVal));
    }

    pg.connect(process.env.DATABASE_URL, function (err, client, done) {
        if(err) {
            done();
            return next(err);
        }

        client.query("SELECT id, join_time, display_name FROM users WHERE username = $1", [req.params.username], function(err, result) {
            if(err) {
                done();
                return next(err);
            }

            if(result.rows.length !== 1) {
                done();
                return next();
            }

            var userInfo = {
                joinTime: new Date(result.rows[0].join_time).toDateString(),
                displayName: result.rows[0].display_name
            };

            client.query("SELECT name, elo, date_added FROM things WHERE added_by = $1 AND visibility >= 100 ORDER BY date_added DESC", [result.rows[0].id], function (err, result) {
                done();

                if(err) {
                    return next(err);
                }

                //The number of rows is the total number of things submitted.
                userInfo.thingCount = result.rows.length;

                if(userInfo.thingCount > 0)
                {
                    //Convert the 10 most recently submitted things to an Angular-friendly format.
                    userInfo.recentSubmissions = result.rows.slice(0, 10).map(function (row) {
                        return {
                            name: row.name,
                            dateAdded: new Date(row.date_added).toDateString()
                        }
                    });

                    //Find the best and worst things submitted by this user.
                    userInfo.bestThing = result.rows.reduce(function (prev, cur) {return prev.elo > cur.elo ? prev : cur;}).name;
                    userInfo.worstThing = result.rows.reduce(function (prev, cur) {return prev.elo < cur.elo ? prev : cur;}).name;
                }

                cache.set("profile:" + req.params.username, JSON.stringify(userInfo));

                res.json(userInfo);
            });
        });
    });
});

module.exports = router;