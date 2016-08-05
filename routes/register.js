/**
 * Created by Chris on 4/14/2016.
 */

var express = require('express');
var pg = require('pg');
var bcrypt = require('bcryptjs');
var passport = require('passport');
var verifyEmail = require('../email');
var log = require('../log');
var formValidation = require('../formValidation');

var router = express.Router();

router.post('/', function(req, res, next) {
    var errorMessages = formValidation.usernameMessages(req.body.username)
        .concat(formValidation.passwordMessages(req.body.password))
        .concat(formValidation.emailMessages(req.body.email));
    
    if(errorMessages.length === 0) {
        bcrypt.genSalt(10, function(err, salt) {
            if(err) {
                return next(err);
            }

            bcrypt.hash(req.body.password, salt, function(err, hash) {
                if(err) {
                    return next(err);
                }

                pg.connect(process.env.DATABASE_URL, function (err, client, done) {
                    if(err) {
                        done();
                        return next(err);
                    }

                    client.query("INSERT INTO users (username, password, display_name, email) VALUES ($1, $2, $3, $4)", [req.body.username.toLowerCase(), hash, req.body.username, req.body.email], function(err, result) {
                        done();

                        if(err) {
                            if(err.constraint === "users_username_key") {
                                return res.json({
                                    completed: false,
                                    messages: ["Sorry, someone already has that username. Please choose another."]
                                });
                            }
                            if(err.constraint === "users_email_key") {
                                return res.json({
                                    completed: false,
                                    messages: ["There is already an account associated with that email address."]
                                })
                            }
                            return next(err);
                        }

                        passport.authenticate('local')(req, res, function () {
                            res.json({
                                completed: true,
                                username: req.user.username
                            });

                            var logValues = {
                                headers: JSON.stringify(req.headers),
                                ipAddress: req.ip,
                                userId:  req.user ? req.user.id : null
                            };

                            log.logRegister(client, logValues, function (err) {
                                if (err) {
                                    done();
                                    return console.error(err);
                                }

                                if(req.body.email) {
                                    verifyEmail.sendVerifyMessage(req.body.email, req.user.id, client, function(err, data) {

                                        done();

                                        if (err) {
                                            return console.error(err);
                                        }

                                    });
                                }
                                else {
                                    done();
                                }
                            });
                        });
                    });
                });
            });
        });
    }
    else {
        return res.json({
            completed: false,
            messages: errorMessages
        });
    }

});

module.exports = router;