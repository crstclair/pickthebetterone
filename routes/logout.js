/**
 * Created by Chris on 5/12/2016.
 */

var express = require('express');
var log = require('../log');

var router = express.Router();

router.get('/', function(req, res, next) {
    var userId = req.user ? req.user.id : null; //Have to store this for logging before the session is destroyed because req.user will be removed.

    req.session.destroy();
    res.clearCookie('connect.sid');
    res.redirect('/');

    var logValues = {
        headers: JSON.stringify(req.headers),
        ipAddress: req.ip,
        userId: userId
    };

    log.logLogout(logValues, function (err) {
        if (err) {
            return console.error(err);
        }
    });
});

module.exports = router;
