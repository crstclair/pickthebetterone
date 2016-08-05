/**
 * Created by Chris on 5/6/2016.
 */
var lruCache = require('lru-cache');
var pg = require('pg');

cache = lruCache({
    max: 10000000,
    length: function(n, key) {return n.length},
    maxAge: 15 * 60 * 1000 //Fifteen minutes
});

// Finds info for a matchup from the cache or the database, and caches the result if it's from the db 
module.exports.cachedMatchupInfo = function(leftThingName, rightThingName, callback) {
    var cachedVal = cache.get("matchup:" + leftThingName + "/" + rightThingName);

    if(cachedVal) {
        return callback(null, JSON.parse(cachedVal)); //TODO: make this asynchronous
    }

    pg.connect(process.env.DATABASE_URL, function (err, client, done) {
        if(err) {
            done();
            return callback(err);
        }

        client.query("SELECT things.id, things.name, pictures.filename, picture_credits.name AS photocredit, picture_credits.url " +
            "FROM things, pictures LEFT OUTER JOIN picture_credits ON (pictures.credit = picture_credits.id) " +
            "WHERE things.name IN ($1, $2) AND things.visibility >= 100 AND things.picture = pictures.id",
            [leftThingName, rightThingName], function(err, result) {
                done();

                if(err) {
                    return callback(err);
                }

                if(result.rows.length < 2) {
                    return callback();
                }

                var candidates = result.rows.map(function(c) {
                    return {
                        name: c.name,
                        picture: c.filename,
                        id: c.id,
                        photocredit: {
                            name: c.photocredit,
                            url: c.url
                        }
                    };
                });
                var swap = (result.rows[0].name !== leftThingName);
                var matchup = {
                    bucket: process.env.S3BUCKET,
                    candidates: swap ? [candidates[1], candidates[0]] : [candidates[0], candidates[1]]
                };

                cache.set("matchup:" + leftThingName + "/" + rightThingName, JSON.stringify(matchup));
                
                callback(null, matchup);
            });
    });
};

module.exports.cache = cache;