/**
 * Created by Chris on 5/3/2016.
 */

var express = require('express');
var router = express.Router();
var pg = require('pg');

router.post('/', function(req, res, next) {
    pg.connect(process.env.DATABASE_URL, function (err, client, done) {
        if(err) {
            return next(err);
        }

        client.query("SELECT things.name, pictures.filename, picture_credits.name AS photocredit, picture_credits.url " +
            "FROM things, pictures LEFT OUTER JOIN picture_credits ON (pictures.credit = picture_credits.id) " +
            "WHERE lower(things.name) = $1 AND things.picture = pictures.id AND things.visibility >= 100",
            [req.body.name.toLowerCase()], function(err, result) {
                done();

                if(err) {
                    return next(err);
                }

                if(result.rows.length !== 1) {
                    return res.json({bucket: process.env.S3BUCKET});
                }

                res.json({
                    bucket: process.env.S3BUCKET,
                    thing: {
                        name: result.rows[0].name,
                        picture: result.rows[0].filename,
                        photocredit: result.rows[0].photocredit,
                        photocredit_url: result.rows[0].url
                    }
                });
            });
    });
});

module.exports = router;