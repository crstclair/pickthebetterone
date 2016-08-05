/**
 * Created by Chris on 4/19/2016.
 */

var express = require('express');
var passport = require('passport');
var log = require('../log');

var router = express.Router();

router.post('/', passport.authenticate('local'), function(req, res, next) {
    res.json({
        completed: true,
        username: req.user.username
    });

    var logValues = {
        headers: JSON.stringify(req.headers),
        ipAddress: req.ip,
        userId: req.user ? req.user.id : null
    };

    log.logLogin(logValues, function (err) {
        if (err) {
            return console.error(err);
        }
    });
});

module.exports = router;