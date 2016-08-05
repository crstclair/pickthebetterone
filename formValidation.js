/**
 * Created by Chris on 6/7/2016.
 */

//Check if username is valid. Returns empty array if valid and array of error messages otherwise.
module.exports.usernameMessages = function(username) {
    var messages = [];

    if(username) {
        if(username.length < 2) {messages.push('Username must be at least 2 characters.');}
        if(username.length > 20) {messages.push('Username must be no longer than 20 characters.');}
        if(!(/^[a-zA-Z]\w*$/).test(username)) {messages.push('Username must begin with a letter and have only letters, numbers, and underscores.');}
    }
    else {
        messages.push('Username required.');
    }

    return messages;
};

//Check if password is valid. Returns empty array if valid and array of error messages otherwise.
module.exports.passwordMessages = function (password) {
    var messages = [];

    if(password) {
        if(password.length < 5) {messages.push('Password must be at least 5 characters.');}
        if(password.length > 72) {messages.push('Password must be no longer than 72 characters.');}
    }
    else {
        messages.push('Password required.');
    }

    return messages;
};

//Check if email address is valid. Returns empty array if valid and array of error messages otherwise.
module.exports.emailMessages = function(email) {
    var messages = [];

    if(email) {
        if(email.length > 50) {messages.push('Email can be no longer than 50 characters.');}
        if(!(/^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i).test(email)) {messages.push('Invalid email address.')} //Angular's email regexp
    }

    return messages;
};

//Check if display name is valid. Returns empty array if valid and array of error messages otherwise.
module.exports.displayNameMessages = function (displayName) {
    var messages = [];

    if(displayName) {
        if(displayName.length > 20) {messages.push('Display name can be at most 20 characters.');}
    }

    return messages;
};