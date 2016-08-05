/**
 * Created by Chris on 5/18/2016.
 */

var express = require('express');
var pg = require('pg');
var aws = require('aws-sdk');
var log = require('../log');

var router = express.Router();

router.post('/:token', function(req, res, next) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        if (err) {
            done();
            return next(err);
        }

        client.query('UPDATE users SET email_verification_token = NULL, email_verification_send_time = NULL, email_verification_status = 3 ' +
            'WHERE email_verification_token = $1 AND email_verification_send_time + make_interval(days := 7) > now() RETURNING id', [req.params.token], function (err, result) {
            if(err) {
                done();
                return next(err);
            }

            if(result.rowCount !== 1)
            {
                done();
                return res.json({
                    completed: false,
                    messages: ["Invalid token."]
                });
            }

            res.json({
                completed: true
            });

            var logValues = {
                headers: JSON.stringify(req.headers), //headers
                ipAddress: req.ip, //ip_address
                userId: result.rows[0].id //user
            };

            log.logEmailVerification(client, logValues, function () {
                done();

                if (err) {
                    return console.error(err);
                }
            });
        });
    });
});

module.exports = router;