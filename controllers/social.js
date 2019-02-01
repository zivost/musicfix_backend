var request = require('request');

function verifyFacebookToken(fbToken, callback) {
    let apptoken = process.env.FB_APP_TOKEN;
    let text = "?input_token=" + fbToken + "&access_token=" + apptoken;
    let url_data = encodeURIComponent(text);
    // console.log(text);
    request({
        url: 'https://graph.facebook.com/debug_token' + text,
        method: "GET",
    }, function(err, result, body) {
        if (err) {
            console.log("fb err", err);
            return callback(false);
        } else {
            body = JSON.parse(body);
            // console.log(body.data);
            if (body.data) {
                if (body.data.is_valid) {
                    return callback(true);
                } else {
                    return callback(false);
                }
            } else {
                return callback(false);
            }
        }
    });
};
exports.verifyFacebookToken = verifyFacebookToken;