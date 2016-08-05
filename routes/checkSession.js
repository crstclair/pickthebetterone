/**
 * Created by Chris on 5/12/2016.
 */

var express = require('express');

var router = express.Router();

router.get('/', function(req, res, next) {
    var data;

    res.set('Cache-Control', 'no-Cache');

    if(req.user) {
        data = {
            loggedIn: true,
            username: req.user.username
        }
    }
    else {
        data = {
            loggedIn: false
        }
    }

    res.json(data);
});

module.exports = router;