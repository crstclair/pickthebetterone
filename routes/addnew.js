/**
 * Created by Chris on 4/12/2016.
 */
var express = require('express');
var multer = require('multer');
var pg = require('pg');
var aws = require('aws-sdk');
var log = require('../log');

var router = express.Router();
var storage = multer.memoryStorage();
var upload = multer({
    storage: storage,
    limits: {
        files: 1,
        fileSize: 3000000
    }});
var s3 = new aws.S3();

function randString(length) {
    var characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
    var res = "";

    for(var i = 0; i < length; ++i) {
        res += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return res;
}

router.post('/', upload.single('picture'), function(req, res, next) {
    var messages = [];

    if(!req.user) {
        res.clearCookie('connect.sid');
        messages.push("You are not logged in.");
    }
    
    if(!req.body.name) {messages.push("Please include the name of your thing.");}
    if(!req.file) {messages.push("Please include a picture of the thing you're submitting. People won't vote for it if they don't see a picture. People are funny like that.")}
    
    if(messages.length > 0) {
        return res.json({
            completed: false,
            messages: messages
        })
    }

    // var extn = req.file.originalname.match(/\.\w+$/);
    // if(!extn) {messages.push("Filename must include an image type extension.")}
    if(!(/^[\w\u0020().'-]*$/).test(req.body.name)) {messages.push("The name of your thing may only contain the following characters: letters, numbers, spaces, apostrophes, parentheses, periods, and hyphens.")}

    if(messages.length > 0) {
        return res.json({
            completed: false,
            messages: messages
        })
    }

    var filename = randString(20); // + extn[0].toLowerCase();

    if(['image/gif', 'image/png', 'image/jpeg', 'image/pjpeg'].indexOf(req.file.mimetype) === -1)
    {
        return res.json({
            completed: false,
            messages: ["Please use only gif, jpg, or png images."]
        });
    }

    pg.connect(process.env.DATABASE_URL, function (err, client, done) {
        if(err) {
            done();
            return next(err);
        }

        var queryString, queryParams;
        if(req.body.credit || req.body.creditUrl)
        {
            queryString = "WITH cred AS (INSERT INTO picture_credits (name, url) VALUES ($1, $2) RETURNING id), " +
                "pic AS (INSERT INTO pictures (filename, credit) SELECT $3, id FROM cred RETURNING id) " +
                "INSERT INTO things (name, picture, added_by) SELECT $4, id, $5 FROM pic RETURNING id";
            queryParams = [req.body.credit, req.body.creditUrl, filename, req.body.name, req.user.id];
        }
        else
        {
            queryString = "WITH pic AS (INSERT INTO pictures (filename) VALUES ($1) RETURNING id) " +
                "INSERT INTO things (name, picture, added_by) SELECT $2, id, $3 FROM pic RETURNING id";
            queryParams = [filename, req.body.name, req.user.id];
        }

        client.query(queryString, queryParams, function (err, result) {
            if(err) {
                done();

                if(err.constraint === "things_ci_name_idx") {
                    return res.json({
                        completed: false,
                        messages: ["A thing by that name is already in the database. If you can't find it, it might not be approved yet."]
                    });
                }
                return next(err);
            }

            s3.putObject({
                Bucket: process.env.S3BUCKET,
                Key: filename,
                Body: req.file.buffer,
                ContentType: req.file.mimetype
            }, function (err) {
                if(err) {
                    return next(err);
                }

                res.json({completed: true});

                var logValues = {
                    headers: JSON.stringify(req.headers),
                    ipAddress: req.ip,
                    userId: req.user.id,
                    submittedThingId: result.rows[0].id
                };

                log.logSubmit(client, logValues, function (err) {
                    done();

                    if (err) {
                        return console.error(err);
                    }
                });
            });
        })
    });
});

module.exports = router;