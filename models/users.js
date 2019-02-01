const db = require('./db');
const moment = require('moment');
const request = require('request');

const table = 'users';

exports.common = require('./common')(table);


exports.insert = function (data, done) {
    let timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
        let queryBuilder = db.insert([{
            name: data.name,
            email: data.email,
            password: data.password,
            mobile: data.mobile,
            loginType: data.loginType,
            accountId: data.accountId,
            salt: data.salt,
            socialId: data.fbId,
            socialToken: data.fbToken,
            isNumberVerified: 0,
            created_at: timestamp,
            updated_at: timestamp
        }],'id').into(table);
        queryBuilder.asCallback(function (err, result) {
            if (err) {
                return done(err);
            }
            done(null, result);
        });
}

exports.getAllUsedAccountIds = function (data, done) {
    let queryBuilder = db.raw(`SELECT GROUP_CONCAT(accountId) AS csv_data FROM ` + table + `;`);
    queryBuilder.asCallback(function (err, result) {
        if (err) {
            return done(err);
        }
        done(null, result)
    });
};

exports.readByKeyValue = function (data, done) {
    let timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    let queryBuilder = db.select().from(table);
    queryBuilder = queryBuilder.where(data.key, data.value);
    queryBuilder.asCallback(function (err, result) {
        if (err) {
            return done(err);
        }
        done(null, result)
    });
};

exports.getByEmail = function(data, done) {
    let queryBuilder = db.select().from(table);
    queryBuilder = queryBuilder.where('email', data.email);
    queryBuilder.asCallback(function(err, result) {
        if (err) {
            return done(err);
        }
        done(null, result)
    });
}
exports.updateLoginInfo = function (data, done) {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    let queryBuilder = db.where('id', data.id).update({
        lastLogin: timestamp
    }).into(table);
    queryBuilder.asCallback(function (err, result) {
        if (err) {
            return done(err);
        }
        done(null, result)
    });
};

exports.updateSocialLogin = function (data, done) {
    let timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    let queryBuilder = db.where('id', data.id).update({
        name: data.name,
        email: data.email,
        socialId: data.fbId,
        socialToken: data.fbToken,
        updated_at: timestamp
    }).into(table);
    queryBuilder.asCallback(function (err, result) {
        if (err) {
            return done(err);
        }
        done(null, result)
    });
};

function getUserDetails(token, callback) {
    console.log("getUserDetails Token");
    let text = `?access_token=${token}&fields=id,birthday,email,picture{url},first_name,last_name,gender`;
    let url_data = encodeURIComponent(text);

    request({
        url: `https://graph.facebook.com/me${text}`,
        method: "GET",
    }, function(err, result, body) {
        if (err) {
            console.log("fb err", err);
            return callback(false);
        } else {
            let result = JSON.parse(body);
            if(!result.first_name || !result.birthday || !result.email){
                // console.log(result)
                let permError = {
                    error: true,
                    message: "unable to get certain permissions."
                }
                return callback(permError);
            }
            let response = result;
            response.error = false;
            return callback(response);
        }
    });
};
exports.getUserDetails = getUserDetails;

exports.updateToken = function (data, done) {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    let queryBuilder = db.where('id', data.user).update({
        appleToken: data.appleToken,
        storeFrontId: data.storeFrontId,
        updated_at: timestamp
    }).into(table);
    queryBuilder.asCallback(function (err, result) {
        if (err) {
            return done(err);
        }
        done(null, result)
    });
};



