/**
 * Created by Chris on 5/16/2016.
 */
var express = require('express');
var pg = require('pg');
var aws = require('aws-sdk');
var ses = new aws.SES({apiVersion: '2010-12-01', region: 'us-east-1'});
var bcrypt = require('bcryptjs');
var crypto = require('crypto');
var log = require('../log');
var sendEmail = require('../email');

var router = express.Router();

//initiate reset request
router.post('/', function(req, res, next) {

    if(!req.body.identity) {
        return res.json({
            completed: false,
            messages: ["Please enter your username or email."]
        });
    }

    if((/^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i).test(req.body.identity)) {//Angular's email regexp
        //User sent us an email address

        pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            if (err) {
                done();
                return next(err);
            }

            client.query('SELECT id, username, reset_request_time FROM users WHERE email = $1 AND email_verification_status = 3', [req.body.identity], function (err, result) {
                if(err) {
                    done();
                    return next(err);
                }

                if(result.rows.length !== 1) {
                    done();
                    return res.json({
                        completed: false,
                        messages: ["There is no account with that email address. Email addresses are case sensitive. Make sure you are using the same capitalization as when you gave us your email."]
                    });
                }

                if(result.rows[0].reset_request_time && new Date(result.rows[0].reset_request_time.getTime() + 15 * 60 * 1000) > new Date()) {
                    done();
                    return res.json({
                        completed: false,
                        messages: ["A reset email was already sent to your address. Allow up to an hour for the email to arrive. Please check your spam folders if you still haven't received it."]
                    });
                }

                res.json({
                    completed: true
                });

                sendEmail.sendResetMessage(client, req.body.identity, result.rows[0].username, function (err, data) {

                    if(err) {
                        done();
                        return console.error(err);
                    }

                    var logValues = {
                        headers: JSON.stringify(req.headers), //headers
                        ipAddress: req.ip, //ip_address
                        userId: result.rows[0].id //user
                    };

                    log.logPasswordResetRequest(client, logValues, function (err) {
                        done();

                        if (err) {
                            return console.error(err);
                        }
                    });
                });
            });
        });
    }
    else {
        //User sent a username (maybe)

        pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            if (err) {
                done();
                return next(err);
            }

            client.query('SELECT id, email, reset_request_time, email_verification_status FROM users WHERE username = $1', [req.body.identity.toLowerCase()], function (err, result) {
                if(err) {
                    done();
                    return next(err);
                }

                if(result.rows.length !== 1) {
                    done();
                    return res.json({
                        completed: false,
                        messages: ["There is no user with that username. Try entering your email address if you can't remember your username."]
                    });
                }

                if(result.rows[0].reset_request_time && new Date(new Date(result.rows[0].reset_request_time).getTime() + 15 * 60 * 1000) > new Date()) {
                    done();
                    return res.json({
                        completed: false,
                        messages: ["A reset email was already sent to your address. Allow up to an hour for the email to arrive. Please check your spam folders if you still haven't received it."]
                    });
                }

                var email = result.rows[0].email;

                if(!email || result.rows[0].email_verification_status !== 3) {
                    done();
                    return res.json({
                        completed: false,
                        messages: ["Unfortunately, your account does not have an email address associated with it, or the email address was never verified."]
                    });
                }

                res.json({
                    completed: true
                });

                sendEmail.sendResetMessage(client, email, req.body.identity, function (err, data) {

                    if(err) {
                        done();
                        return console.error(err);
                    }

                    var logValues = {
                        headers: JSON.stringify(req.headers), //headers
                        ipAddress: req.ip, //ip_address
                        userId: result.rows[0].id //user
                    };

                    log.logPasswordResetRequest(client, logValues, function (err) {
                        done();

                        if (err) {
                            return console.error(err);
                        }
                    });
                });
            });
        });
    }
});

router.post('/:token', function(req, res, next) {
    var newPassword = crypto.randomBytes(10).toString("base64").replace(/[=+/]/g, function(c){return {'\+': '-', '/': '_', '=': ''}[c];});

    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        if(err) {
            return next(err);
        }

        bcrypt.genSalt(10, function(err, salt) {
            if (err) {
                return next(err);
            }

            bcrypt.hash(newPassword, salt, function (err, hash) {
                if (err) {
                    return next(err);
                }

                client.query('UPDATE users SET password = $1, reset_token = NULL, reset_request_time = NULL WHERE reset_token = $2 AND reset_request_time + make_interval(days := 1) > now() RETURNING id', [hash, req.params.token], function(err, result) {
                    if(err) {
                        done();
                        return next(err);
                    }

                    if(result.rowCount !== 1) {
                        done();
                        return res.json({
                            completed: false,
                            messages: ["Could not reset password. The server did not recognize the secret number you gave it. Reset requests expire after 24 hours, so resetting your password again if it's been that long."]
                        });
                    }

                    res.json({
                        completed: true,
                        newPassword: newPassword
                    });

                    var logValues = {
                        headers: JSON.stringify(req.headers), //headers
                        ipAddress: req.ip, //ip_address
                        userId: result.rows[0].id //user
                    };

                    log.logPasswordReset(client, logValues, function (err) {
                        done();

                        if (err) {
                            return console.error(err);
                        }
                    });
                });
            });
        });
    });
});

module.exports = router;