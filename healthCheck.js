/**
 * Created by Chris on 6/19/2016.
 */
var request = require('request');
var aws = require('aws-sdk');

var sns = new aws.SNS({apiVersion: '2010-03-31', region: 'us-east-1'});

module.exports.startHealthCheck = function (url) {
    setInterval(function(interval) {
        request(url, function(err, response, body) {
            if(err) {
                return console.error("Error doing health check: ", err);
            }
            if(response.statusCode == 504) {
                sns.publish({
                    TopicArn: 'arn:aws:sns:us-east-1:380100340566:PBO_Timeout',
                    Subject: 'Restart',
                    Message: 'Gateway timeout. Shutting down app server.'
                }, function (err, data) {
                    if(err) {
                        console.error(err);
                    }
                    process.exit(1);
                });
            }
        });
    }, 90 * 1000);

    console.log("Internal health check loaded for " + url);
};