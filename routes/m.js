/**
 * Created by Chris on 5/31/2016.
 *
 * Redirects user to the main app while providing opengraph tags to social sharing sites
 */
var express = require('express');
var handlebars = require('handlebars');
var cache = require('../cache');

var router = express.Router();

var source =
    '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta property="og:title" content="{{leftThing.name}} vs {{rightThing.name}}: Pick the Better One" />' +
    '<meta property="og:url" content="https://www.pickthebetterone.com/#/m/{{leftThing.name}}/{{rightThing.name}}" />' +
    '<meta property="og:image" content="https://s3.amazonaws.com/{{bucket}}/{{leftThing.picture}}" />' +
    '<meta property="og:image" content="https://s3.amazonaws.com/{{bucket}}/{{rightThing.picture}}" />' +
    '<meta http-equiv="refresh" content="0; url=/#/m/{{leftThing.name}}/{{rightThing.name}}" />' + 
    '<title>{{leftThing.name}} vs {{rightThing.name}}: Pick the Better One</title>' +
    '</head>' +
    '<body></body>' +
    '</html>';
var template = handlebars.compile(source);

router.get('/:leftThing/:rightThing', function (req, res, next) {
    cache.cachedMatchupInfo(req.params.leftThing, req.params.rightThing, function(err, result) {
        if(err) {
            return next(err);
        }

        if(!result) {
            return next();
        }

        var data = {
            bucket: result.bucket,
            leftThing: result.candidates[0],
            rightThing: result.candidates[1]
        };
        var page = template(data);

        res.send(page);
    });
});

module.exports = router;