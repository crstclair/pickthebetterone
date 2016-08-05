/**
 * Created by Chris on 3/29/2016.
 */
var express = require('express');
var router = express.Router();
var pg = require('pg');
var cache = require('../cache').cache;

router.get('/:thingName', function(req, res, next) {
    var cachedVal = cache.get("stats:" + req.params.thingName);

    if(cachedVal) {
        return res.json(JSON.parse(cachedVal));
    }

    pg.connect(process.env.DATABASE_URL, function (err, client, done) {
        if(err) {
            return next(err);
        }

        client.query("SELECT things.id, things.name, things.date_added, things.votes_for_or_against, things.elo, pictures.filename, users.username, users.display_name, picture_credits.name AS photocredit, picture_credits.url " +
            "FROM things LEFT JOIN pictures ON (things.picture = pictures.id) LEFT JOIN users ON (things.added_by = users.id) LEFT JOIN picture_credits ON (pictures.credit = picture_credits.id) " +
            "WHERE things.name = $1 AND things.visibility >= 100",
            [req.params.thingName], function(err, result) {
            done();

            if(err) {
                return next(err);
            }

            if(result.rows.length !== 1) {
                return next();
            }

            var stats = {
                bucket: process.env.S3BUCKET,
                name: result.rows[0].name,
                picture: result.rows[0].filename,
                score: result.rows[0].elo,
                photocredit: result.rows[0].photocredit,
                photocredit_url: result.rows[0].url,
                votes: result.rows[0].votes_for_or_against,
                dateAdded: new Date(result.rows[0].date_added).toDateString(),
                addedBy: result.rows[0].display_name || result.rows[0].username,
                username: result.rows[0].username
            };

            cache.set("stats:" + req.params.thingName, JSON.stringify(stats));

            res.json(stats);
        });
    });
});

module.exports = router;