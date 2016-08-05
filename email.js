/**
 * Created by Chris on 5/18/2016.
 */

var aws = require('aws-sdk');
var ses = new aws.SES({apiVersion: '2010-12-01', region: 'us-east-1'});
var crypto = require('crypto');

var accountsEmail;

//Sends and email and retries after a random amount of time if it fails due to sending rate being exceeded.
function sendEmailRetries(to, from, subject, htmlBody, textBody, retries, callback) {
    ses.sendEmail({
        Destination: {
            ToAddresses: [to]
        },
        Source: from,
        Message: {
            Subject: {
                Data: subject
            },
            Body: {
                Html: {
                    Data: htmlBody
                },
                Text: {
                    Data: textBody
                }
            }
        }
    }, function(err, result) {
        if (err) {
            console.error("Error sending email.", err);
            if (err.message === "Maximum sending rate exceeded." && retries > 0) {
                return setTimeout(sendEmailRetries, Math.random() * 10 * 60 * 1000, to, from, subject, htmlBody, textBody, retries - 1, callback);
            }
        }
        callback(err, result);
    });
}

//Sends a test email. Not for production
function sendTestMessage(email, callback) {
    // var time = Math.random() * 10 * 60 * 1000;
    // console.log(time);
    // setTimeout(sendEmailRetries, time, email, 'pickthebetterone@gmail.com', 'Testing', 'Just trying to send an email here, don\'t worry about me.', 'Just trying to send an email here, don\'t worry about me.', 10, callback);

    sendEmailRetries(
        email, //to
        'pickthebetterone@gmail.com', //from
        'Testing', //subject
        'Just trying to send an email here, don\'t worry about me.', //htmlBody
        'Just trying to send an email here, don\'t worry about me.', //textBody
        10, //retries
        callback
    );
}

//Sends an email to verify an account's email address. Generates the verification token and updates the database.
//dbClient is a pg(postgres) object
function sendVerifyMessage(email, userId, dbClient, callback) {
    var token =  crypto.randomBytes(36).toString("base64").replace(/[=+/]/g, function(c){return {'\+': '-', '/': '_', '=': ''}[c];});

    dbClient.query('UPDATE users SET email_verification_token = $1, email_verification_send_time = now(), email_verification_status = 2 WHERE id = $2', [token, userId], function (err) {
        if(err) {
            return callback(err);
        }

        sendEmailRetries(
            email, //to
            accountsEmail, //from
            'Please verify your email address', //subject
            '<p>This email was sent to verify your email address with PickTheBetterOne.com. Please click the link below to complete the verification process.</p>' +
            '<p><a href="https://www.pickthebetterone.com/#/verify/' + token + '">https://www.pickthebetterone.com/#/verify/' + token + '</a></p>' +
            '<p>This link will expire in 7 days.</p>' +
            '<p>If you do not have an account at PickTheBetterOne.com, please ignore this email.</p>', //htmlBody
            'This email was sent to verify your email address with PickTheBetterOne.com. Please copy the link below into your browser to complete the verification process.\n' +
            'https://www.pickthebetterone.com/#/verify/' + token + '\n' +
            'This link will expire in 7 days.\n' +
            'If you do not have an account at PickTheBetterOne.com, please ignore this email.', //textBody
            10, //retries
            callback
        );
    })
}

//Sends an email to reset a user's password. Generates the token and updates the database.
//dbClient is a pg(postgres) object
function sendResetMessage(dbClient, recipient, username, callback) {
    var token = crypto.randomBytes(36).toString("base64").replace(/[=+/]/g, function(c){return {'\+': '-', '/': '_', '=': ''}[c];});

    dbClient.query("UPDATE users SET reset_token = $1, reset_request_time = NOW() WHERE username = $2", [token, username], function(err, result) {
        if(err) {
            return callback(err);
        }

        sendEmailRetries(
            recipient, //to
            accountsEmail, //from
            'Account Recovery for PickTheBetterOne.com', //subject
            '<p>This email was sent because we received a request to reset your account password.</p>' +
            '<p>Your username is: <strong>' + username + '</strong></p>' +
            '<p>To continue with password reset, please click the following link: ' +
            '<a href="https://www.pickthebetterone.com/#/np/' + token + '">https://www.pickthebetterone.com/#/np/' + token + '</a></p>' +
            '<p>This link will expire in 24 hours.</p>' +
            '<p>If you did not make this request, please ignore this email. Your account information is safe.</p>', //htmlBody
            'This email was sent because we received a request to reset your account password.\n' +
            'Your username is: ' + username + '\n' +
            'To continue with password reset, please copy and paste the following link into your browser:\n' +
            'https://www.pickthebetterone.com/#/np/' + token + '\n' +
            'This link will expire in 24 hours.\n' +
            'If you did not make this request, please ignore this email. Your account information is safe.', //textBody
            10, //retries
            callback
        );
    });
}

//Configuration for this module. Must be called before any email is sent.
module.exports.config = function (config) {
    accountsEmail = config.accountsEmail; //Email address which will be listed as the "from" for emails sent regarding accounts.
};
module.exports.sendVerifyMessage = sendVerifyMessage;
module.exports.sendResetMessage = sendResetMessage;
module.exports.sendTestMessage = sendTestMessage;