/**
 * Created by Chris on 5/28/2016.
 */
var pg = require('pg');

function makeLogger(query, mapper) {
    return function(client, params, callback) {
        client.query(query, mapper(params), callback);
    };
}

function makeDBConnector(logger) {
    return function(params, callback) {
        pg.connect(process.env.DATABASE_URL, function (err, client, done) {
            if(err) {
                done();
                return callback(err);
            }

            logger(client, params, function(err, result) {
                done();

                callback(err, result);
            });
        });
    };
}

//
//Logger for votes
//
module.exports.logVote = makeLogger(
    'INSERT INTO log ' +
    '(action, headers, ip_address, "user", thing1, thing1_start_elo, thing1_end_elo, thing2, thing2_start_elo, thing2_end_elo) ' +
    'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
    function(params) {
        return [
            1, //action (1 = vote)
            params.headers,
            params.ipAddress,
            params.userId,
            params.winningThing.id,
            params.winningThing.elo,
            params.winningThing.newElo,
            params.losingThing.id,
            params.losingThing.elo,
            params.losingThing.newElo
        ];
    }
);

//
//Logger for logins
//
module.exports.logLogin = makeDBConnector(
    makeLogger(
        'INSERT INTO log (action, headers, ip_address, "user") VALUES ($1, $2, $3, $4)',
        function(params) {
            return [
                2, //action (2 = Log in)
                params.headers,
                params.ipAddress,
                params.userId
            ];
        }
    )
);

//
//Logger for logouts
//
module.exports.logLogout = makeDBConnector(
    makeLogger(
        'INSERT INTO log (action, headers, ip_address, "user") VALUES ($1, $2, $3, $4)',
        function(params) {
            return [
                3, //action (3 = Log out)
                params.headers,
                params.ipAddress,
                params.userId
            ];
        }
    )
);

//
//Logger for submissions
//
module.exports.logSubmit = makeLogger(
    'INSERT INTO log (action, headers, ip_address, "user", thing_submitted) VALUES ($1, $2, $3, $4, $5)',
    function(params) {
        return [
            4, //action (4 = Submit)
            params.headers,
            params.ipAddress,
            params.userId,
            params.submittedThingId
        ];
    }
);

//
//Logger for registrations
//
module.exports.logRegister = makeLogger(
    'INSERT INTO log (action, headers, ip_address, "user") VALUES ($1, $2, $3, $4)',
    function(params) {
        return [
            5, //action (5 = Register)
            params.headers,
            params.ipAddress,
            params.userId
        ];
    }
);

//
//Logger for email changes
//
module.exports.logEmailChange = makeLogger(
    'INSERT INTO log (action, headers, ip_address, "user", start_value, end_value) VALUES ($1, $2, $3, $4, $5, $6)',
    function(params) {
        return [
            6, //action (6 = Change email)
            params.headers,
            params.ipAddress,
            params.userId,
            params.startEmail,
            params.endEmail
        ];
    }
);

//
//Logger for password changes
//
module.exports.logPasswordChange = makeLogger(
    'INSERT INTO log (action, headers, ip_address, "user") VALUES ($1, $2, $3, $4)',
    function(params) {
        return [
            7, //action (7 = Change password)
            params.headers,
            params.ipAddress,
            params.userId
        ];
    }
);

//
//Logger for display name changes
//
module.exports.logDisplayNameChange = makeLogger(
    'INSERT INTO log (action, headers, ip_address, "user", start_value, end_value) VALUES ($1, $2, $3, $4, $5, $6)',
    function(params) {
        return [
            8, //action (8 = Change display name)
            params.headers,
            params.ipAddress,
            params.userId,
            params.startDisplayName,
            params.endDisplayName
        ];
    }
);

//
//Logger for password reset requests
//
module.exports.logPasswordResetRequest = makeLogger(
    'INSERT INTO log (action, headers, ip_address, "user") VALUES ($1, $2, $3, $4)',
    function(params) {
        return [
            9, //action (9 = Password reset request)
            params.headers,
            params.ipAddress,
            params.userId
        ];
    }
);

//
//Logger for password resets
//
module.exports.logPasswordReset = makeLogger(
    'INSERT INTO log (action, headers, ip_address, "user") VALUES ($1, $2, $3, $4)',
    function(params) {
        return [
            10, //action (10 = Password reset)
            params.headers,
            params.ipAddress,
            params.userId
        ];
    }
);

//
//Logger for email verifications
//
module.exports.logEmailVerification = makeLogger(
    'INSERT INTO log (action, headers, ip_address, "user") VALUES ($1, $2, $3, $4)',
    function(params) {
        return [
            11, //action (11 = Verify email)
            params.headers,
            params.ipAddress,
            params.userId
        ];
    }
);