/**
 * Created by Chris on 6/9/2016.
 */


var express = require('express');
var verifyEmail = require('../email');

var router = express.Router();

router.get('/', function(req, res, next) {
    for(var i = 0; i < 1; ++i) {
        verifyEmail.sendTestMessage("chris.r.st.clair@gmail.com", function(err, data) {
            if(err)
            {
                console.error(err);
            }
            else
            {
                console.log("Sent!");
            }
        });
    }

    res.send("Blasted!");
});

module.exports = router;