/**
 * Created by Chris on 4/20/2016.
 */

var pg = require('pg');
var bcrypt = require('bcryptjs');

//Used by Passport to find a user
module.exports.findUser = function (username, callback) {
    pg.connect(process.env.DATABASE_URL, function (err, client, done) {
        if (err) {
            done();
            return callback(err);
        }

        client.query('SELECT id, username, password FROM users WHERE username = $1', [username.toLowerCase()], function (err, result) {
            done();

            if (err) {
                return callback(err);
            }

            if(result.rows.length === 0) {
                return callback(null, null);
            }
            
            return callback(null, {
                id: result.rows[0].id,
                username: result.rows[0].username,
                checkPassword: function (password, callback) {
                    bcrypt.compare(password, result.rows[0].password, callback);
                }
            });
        })
    });
};