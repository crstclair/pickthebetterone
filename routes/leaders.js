/**
 * Created by Chris on 5/1/2016.
 */

var express = require('express');
var router = express.Router();
var pg = require('pg');
var cache = require('../cache').cache;

router.get('/', function(req, res, next) {
    var cachedVal = cache.get("leaders");

    if(cachedVal) {
        return res.json(JSON.parse(cachedVal));
    }

    pg.connect(process.env.DATABASE_URL, function (err, client, done) {
        if (err) {
            done();
            return next(err);
        }

        client.query("SELECT name, elo FROM things WHERE visibility >= 100 ORDER BY elo DESC LIMIT 10", [], function (err, result) {
            var topThings = [];

            if(err) {
                done();
                return next(err);
            }

            for(var i = 0; i < result.rows.length; ++i) {
                topThings.push({
                    'name': result.rows[i].name,
                    'score': result.rows[i].elo
                });
            }

            client.query("SELECT name, elo FROM things WHERE visibility >= 100 ORDER BY elo ASC LIMIT 10", [], function (err, result) {
                var bottomThings = [];

                done();

                if(err) {
                    return next(err);
                }

                for(var i = 0; i < result.rows.length; ++i) {
                    bottomThings.push({
                        'name': result.rows[i].name,
                        'score': result.rows[i].elo
                    });
                }

                var leaders = {
                    'topThings': topThings,
                    'bottomThings': bottomThings
                };

                cache.set("leaders", JSON.stringify(leaders));

                res.json(leaders);
            });
        })
    });
});

module.exports = router;