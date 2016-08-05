/**
 * Created by Chris on 5/10/2016.
 */

var express = require('express');
var router = express.Router();
var pg = require('pg');
var userModule = require('../user');
var bcrypt = require('bcryptjs');
var verifyEmail = require('../email');
var log = require('../log');
var formValidation = require('../formValidation');

router.get('/', function(req, res, next) {

    if(!req.user) {
        res.clearCookie('connect.sid');
        return next(new Error("Invalid session")); //TODO: redirect to login screen instead
    }

    pg.connect(process.env.DATABASE_URL, function (err, client, done) {
        if(err) {
            done();
            return next(err);
        }

        client.query("SELECT display_name, email, email_verification_status FROM users WHERE id = $1", [req.user.id], function(err, result) {
            done();

            if(err) {
                return next(err);
            }

            if(result.rows.length !== 1) {
                return next();
            }

            res.set('Cache-Control', 'no-Cache');

            res.json({
                username: req.user.username,
                profile:{
                    displayName: result.rows[0].display_name
                },
                contact:{
                    email: result.rows[0].email,
                    emailVerified: result.rows[0].email && (result.rows[0].email_verification_status === 3),
                    emailNotVerified: result.rows[0].email && (result.rows[0].email_verification_status !== 3)
                }
            });
        });
    });
});

router.post('/changeDisplayName/', function (req, res, next) {
    if(!req.user) {
        res.clearCookie('connect.sid');
        return next(new Error("Invalid session")); //TODO: redirect to login screen instead
    }

    var errorMessages = formValidation.displayNameMessages(req.body.displayName);
    if(errorMessages.length > 0) {
        return res.json({
            completed: false,
            messages: errorMessages
        });
    }

    pg.connect(process.env.DATABASE_URL, function (err, client, done) {
        if(err) {
            done();
            return next(err);
        }

        client.query('SELECT display_name FROM users WHERE id = $1', [req.user.id], function (err, result) {
            if (err) {
                done();
                return next(err);
            }

            var oldDisplayName = result.rows[0].display_name;

            client.query("UPDATE users SET display_name = $1 WHERE id = $2", [req.body.displayName, req.user.id], function (err, result) {
                if (err) {
                    return next(err);
                }

                res.json({
                    completed: true
                });

                var logValues = {
                    headers:  JSON.stringify(req.headers),
                    ipAddress: req.ip,
                    userId: req.user ? req.user.id : null,
                    startDisplayName: oldDisplayName,
                    endDisplayName: req.body.displayName
                };

                log.logDisplayNameChange(client, logValues, function() {
                    done();

                    if (err) {
                        return console.error(err);
                    }
                });
            });
        });
    });
});

router.post('/changePassword/', function (req, res, next) {
    if(!req.user) {
        res.clearCookie('connect.sid');
        return next(new Error("Invalid session")); //TODO: redirect to login screen instead
    }

    var errorMessages = formValidation.passwordMessages(req.body.newPassword);
    if(errorMessages.length > 0) {
        return res.json({
            completed: false,
            messages: errorMessages
        });
    }

    userModule.findUser(req.user.username, function(err, user) {

        if(!user) {
            return next(new Error("Could not find user."));
        }
            
        user.checkPassword(req.body.oldPassword, function (err, passwordConfirm) {
            if(err) {
                return next(err);
            }

            if(!passwordConfirm) {
                return res.json({
                    completed: false,
                    messages: ["Incorrect password"]
                });
            }

            bcrypt.genSalt(10, function(err, salt) {
                if(err) {
                    return next(err);
                }

                bcrypt.hash(req.body.newPassword, salt, function(err, hash) {
                    if(err) {
                        return next(err);
                    }

                    pg.connect(process.env.DATABASE_URL, function (err, client, done) {
                        if(err) {
                            done();
                            return next(err);
                        }

                        client.query("UPDATE users SET password = $1 WHERE id = $2", [hash, req.user.id], function(err, result) {
                            done();

                            if(err) {
                                return next(err);
                            }

                            if(result.rowCount === 0) {
                                return next(new Error("Could not find user record."));
                            }

                            //If we got this far, the request succeeded.
                            res.json({
                                completed: true
                            });

                            var logValues = {
                                headers: JSON.stringify(req.headers),
                                ipAddress: req.ip,
                                userId: req.user ? req.user.id : null
                            };

                            log.logPasswordChange(client, logValues, function (err) {
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
    });
});

router.post('/changeEmail/', function (req, res, next) {
    if(!req.user) {
        res.clearCookie('connect.sid');
        return next(new Error("Invalid session")); //TODO: redirect to login screen instead
    }

    var errorMessages = formValidation.emailMessages(req.body.email);

    if(errorMessages.length > 0)
    {
        return res.json({
            completed: false,
            messages: errorMessages
        });
    }

    userModule.findUser(req.user.username, function(err, user) {

        if (!user) {
            return next(new Error("Could not find user."));
        }

        user.checkPassword(req.body.password, function (err, passwordConfirm) {
            if (err) {
                return next(err);
            }

            if (!passwordConfirm) {
                return res.json({
                    completed: false,
                    messages: ["Incorrect password"]
                });
            }

            pg.connect(process.env.DATABASE_URL, function (err, client, done) {
                if (err) {
                    done();
                    return next(err);
                }

                client.query('SELECT email FROM users WHERE id = $1', [req.user.id], function (err, result) {
                    if (err) {
                        done();
                        return next(err);
                    }

                    if (result.rowCount === 0) {
                        done();
                        return next(new Error("Could not find user record."));
                    }

                    var oldEmail = result.rows[0].email;

                    client.query('UPDATE users SET email = $1 WHERE id = $2', [req.body.email, req.user.id], function (err, result) {
                        done();

                        if (err) {
                            if(err.constraint === "users_email_key") {
                                return res.json({
                                    completed: false,
                                    messages: ["There is already an account associated with that email address."]
                                });
                            }
                            return next(err);
                        }

                        if (result.rowCount === 0) {
                            return next(new Error("Could not find user record."));
                        }

                        //If we got this far, it means the request succeeded
                        res.json({
                            completed: true
                        });

                        //Send email verification and log
                        var logValues = {
                            headers: JSON.stringify(req.headers), //headers
                            ipAddress: req.ip, //ip_address
                            userId: req.user ? req.user.id : null, //user
                            startEmail: oldEmail, //start_value
                            endEmail: req.body.email //end_value
                        };

                        if(req.body.email && req.body.email.length > 0)
                        {
                            verifyEmail.sendVerifyMessage(req.body.email, req.user.id, client, function(err, data) {

                                log.logEmailChange(client, logValues, function () {
                                    done();

                                    if (err) {
                                        return console.error(err);
                                    }
                                });
                            });
                        }
                        else {
                            //user deleted their email address
                            log.logEmailChange(client, logValues, function () {
                                done();

                                if (err) {
                                    return console.error(err);
                                }
                            });
                        }
                    });
                });
            });
        });
    });
});

module.exports = router;
