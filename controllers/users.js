const mute = require('immutable');
const async = require('async');
const moment = require('moment');
const request = require('request');

const users = require('../models/users');
const socialVerify = require('./social');

const utilities = require('../helpers/security');
// Response Struct
const responseStruct = mute.Map({
    signature: null,
    success: null,
    message: "",
    type: "users",
    action: null,
    id: null,
    data: null,
    status: null
});

const user_signup = function (data, response, cb, isSocial) {
    if (!cb) {
        cb = response;
    }
    data.provider = data.loginType;
    validateSignupInput(data, function (err) {
        if (err) {
            return cb(err);
        } else {
            data.carryPass = data.password;
            async.waterfall([
                async.apply(generatePassword, data),
                async.apply(generateAccountId, data),
                async.apply(insertUser, data),
                async.apply(user_login_async, data)
            ], cb);
        }
    })

};
exports.user_signup = user_signup;

const validateSignupInput = function (data, response, cb) {
    if (!cb) {
        cb = response;
    }
    let functionsWaterfall = [];
    if (data.loginType !== "facebook") {
        if (!data.name || !data.email || !data.password || !data.repeat) {
            console.log("validate_signup_input", data);
            return cb(
                responseStruct.merge({
                    signature: data.req.signature,
                    action: "validate_signup_input",
                    status: 400,
                    success: false,
                    message: "Missing or Invalid Params ",
                }).toJS());
        }
        functionsWaterfall.push(async.apply(validatePassword, data));
    }

    if (data.loginType !== "facebook") {
        if (!data.email) {
            return cb(
                responseStruct.merge({
                    signature: data.req.signature,
                    action: "validate_signup_input",
                    status: 400,
                    success: false,
                    message: "Missing or Invalid Params !!!",
                }).toJS());
        }
        functionsWaterfall.push(async.apply(checkEmailExists, data));
    }
    async.waterfall(functionsWaterfall, cb);
};


const validatePassword = function (data, response, cb) {
    if (!cb) {
        cb = response;
    }
    if (data.password !== data.repeat) {
        return cb(
            responseStruct.merge({
                signature: data.req.signature,
                action: "validate_password",
                status: 400,
                success: false,
                message: "Password and Repeat Password must be same",
            }).toJS());
    }
    if (!utilities.validatePassword(data.password)) {
        return cb(
            responseStruct.merge({
                signature: data.req.signature,
                action: "validate_password",
                status: 400,
                success: false,
                message: "Password Too Weak",
            }).toJS());
    }
    return cb(null,
        responseStruct.merge({
            signature: data.req.signature,
            action: "validate_password",
            status: 204,
            success: true,
            message: "",
        }).toJS());
};

const checkEmailExists = function (data, response, cb) {
    if (!cb) {
        cb = response;
    }
    if (!data.email) {
        return cb(
            responseStruct.merge({
                signature: data.req.signature,
                action: "validate_email",
                status: 400,
                success: false,
                message: "Invalid Email Address",
            }).toJS());
    }
    if (!utilities.validateEmail(data.email)) {
        return cb(
            responseStruct.merge({
                signature: data.req.signature,
                action: "validate_email",
                status: 400,
                success: false,
                message: "Invalid Email Address",
            }).toJS());
    }
    let where = {
        email: data.email
    };
    users.common.entryExists(where, function (err, res) {
        if (err) {
            console.log(err);
            return cb(
                responseStruct.merge({
                    signature: data.req.signature,
                    action: "validate_email",
                    status: 500,
                    success: false,
                    message: "something went wrong",
                }).toJS());
        }
        if (res.count > 0) {
            return cb(
                responseStruct.merge({
                    signature: data.req.signature,
                    action: "validate_email",
                    status: 400,
                    success: false,
                    message: "Email ID Exists",
                }).toJS());
        } else {
            return cb(null,
                responseStruct.merge({
                    signature: data.req.signature,
                    action: "validate_email",
                    status: 204,
                    success: true,
                    message: "",
                }).toJS());
        }

    })
};

const generatePassword = function (data, response, cb) {
    if (!cb) {
        cb = response;
    }
    utilities.generatePassword(data.password, function (err, hash_data) {
        if (err) {
            console.log(err);
            return cb(responseStruct.merge({
                signature: data.req.signature,
                action: "securing_password",
                status: 500,
                success: false,
                message: "something went wrong",
            }).toJS());
        }
        return cb(null,
            responseStruct.merge({
                signature: data.req.signature,
                action: "securing_password",
                status: 200,
                success: true,
                message: "",
                data: hash_data
            }).toJS());
    });
};

exports.generatePassword = generatePassword;

const generateAccountId = function (data, response, cb) {
    if (!cb) {
        cb = response;
    }
    users.getAllUsedAccountIds({}, function (err, usedAccountIds) {
        if (err) {
            return cb(
                responseStruct.merge({
                    signature: data.req.signature,
                    action: "something went wrong",
                    status: 500,
                    success: false,
                    message: ""
                }).toJS());
        }
        let usedList = [];
        if (usedAccountIds[0].csv_data) {
            usedList = usedAccountIds[0].csv_data.split(',');
        }
        let x = true;
        let accountId = 0;
        while (x) {
            accountId = Math.floor(Math.random() * (99999999 - 11111111) + 11111111);
            if (usedList.indexOf(accountId) < 0) {
                x = false;
            }
        }
        let forwardData = response.data;
        forwardData.accountId = accountId;
        return cb(null,
            responseStruct.merge({
                signature: data.req.signature,
                action: "generate account id",
                status: 200,
                success: true,
                message: "",
                data: forwardData
            }).toJS());
    })
};

const insertUser = function (data, response, cb) {
    if (!cb) {
        cb = response;
    }
    let hash = null;
    let salt = null;
    let accountId = null;
    if (response.data) {
        hash = response.data.hash;
        salt = response.data.salt;
        accountId = response.data.accountId;
    }
    if (!hash || !salt || !accountId) {
        console.log("no hash/salt/accountId");
        return cb(responseStruct.merge({
            signature: data.req.signature,
            action: "insert_user",
            status: 500,
            success: false,
            message: "something went wrong",
        }).toJS());
    }
    let insertData = data;
    insertData.name = data.name;
    insertData.password = hash;
    insertData.repeat = hash;
    insertData.salt = salt;
    insertData.accountId = accountId;

    if (data.provider) {
        switch (data.provider) {
            case "facebook":
                insertData.fbId = data.facebook_id;
                insertData.fbToken = data.facebook_token;
                insertData.carryPass = hash;
                break;
            default:
                console.log("something goes wildly wrong");
                break;
        }
    }

    users.insert(insertData, function (err, res) {
        if (err) {
            console.log(err);
            return cb(responseStruct.merge({
                signature: data.req.signature,
                action: "insert_user",
                status: 500,
                success: false,
                message: "something went wrong",
            }).toJS());
        }

        return cb(null,
            responseStruct.merge({
                signature: data.req.signature,
                action: "insert",
                status: 200,
                success: true,
                message: "You have successfully Joined. Please Login.",
                data: insertData
            }).toJS());
    });

};


const user_login_async = function (data, response, cb) {
    if (!data.email || !data.carryPass || !data.provider) {
        return cb(responseStruct.merge({
            signature: data.req.signature,
            action: "user_login",
            status: 500,
            success: false,
            message: "Email and Password are required",
        }).toJS());
    }
    data.password = data.carryPass;
    user_login(data, cb);
};

const user_login = function (data, cb, isSocial) {
    if (!data.email || !data.loginType) {
        return cb(responseStruct.merge({
            signature: data.req.signature,
            action: "user_login",
            status: 500,
            success: false,
            message: "Email and Password are required",
        }).toJS());
    }

    let functionsWaterfall = [];
    functionsWaterfall.push(async.apply(readByKeyValue, data));
    if (isSocial) {
        if (isSocial === "NOT_VERIFIED") {
            functionsWaterfall.push(async.apply(comparePassword, data));
        }
    } else {
        if (!data.password) {
            return cb(responseStruct.merge({
                signature: data.req.signature,
                action: "user_login",
                status: 500,
                success: false,
                message: "Email and Password are required",
            }).toJS());
        }
    }
    functionsWaterfall.push(async.apply(updateLoginInfo, data));
    functionsWaterfall.push(async.apply(encryptData, data));

    async.waterfall(functionsWaterfall, cb);
};

exports.user_login = user_login;


// Auth validate token

const validate_token = function (data, cb) {
    // console.log("data", data);
    if (!data.token || !data.identifier) {
        return cb(responseStruct.merge({
            signature: data.req.signature,
            action: "validate_token",
            status: 403,
            success: false,
            message: "Invalid Credentials",
        }).toJS());
    }
    tokenPayload = {
        user: data.identifier,
        token: data.token
    };
    // is token valid
    // sessions.readToken(tokenPayload, function (err, response){
    //     if(err){
    //         return cb(responseStruct.merge({
    //             signature: data.req.signature,
    //             action: "validate_token",
    //             status: 403,
    //             success: false,
    //             message: "",
    //         }).toJS());
    //     }
    //     console.log(response[0])
    // })
    readByKeyValue(data, function (err, user) {
        if (err) {
            console.log(err)
            return cb(err);
        }
        //console.log("user",user)
        // console.log("user",data)
        if (!user) {
            return cb(responseStruct.merge({
                signature: data.req.signature,
                action: "validate_token",
                status: 403,
                success: false,
                message: "",
            }).toJS());
        }
        if (!user.data) {
            return cb(responseStruct.merge({
                signature: data.req.signature,
                action: "validate_token",
                status: 403,
                success: false,
                message: "",
            }).toJS());
        } else {
            if (!user.data) {
                return cb(responseStruct.merge({
                    signature: data.req.signature,
                    action: "validate_token",
                    status: 403,
                    success: false,
                    message: "",
                }).toJS());
            }
        }
        let key = user.data.salt;
        utilities.decryptData(data.token, key, function (err, response) {
            if (err) {
                console.log(err);
                return cb(responseStruct.merge({
                    signature: data.req.signature,
                    action: "validate_token",
                    status: 403,
                    success: false,
                    message: "",
                }).toJS());
            }
            return cb(null,
                responseStruct.merge({
                    signature: data.req.signature,
                    action: "validate_token",
                    status: 200,
                    success: false,
                    message: "",
                    data: response
                }).toJS());
        })
    })
};

exports.validate_token = validate_token;


const readByKeyValue = function (data, response, cb) {
    if (!cb) {
        cb = response;
    }
    let login_req = {};
    //second priority
    if (data.email) {
        login_req = {
            key: 'email',
            value: data.email
        }
    }
    //first priority
    if (data.identifier) {
        login_req = {
            key: 'accountId',
            value: data.identifier
        }
    }
    users.readByKeyValue(login_req, function (err, user) {
        if (err) {
            return cb(responseStruct.merge({
                signature: data.req.signature,
                action: "user_login",
                status: 500,
                success: false,
                message: "Something went wrong!",
            }).toJS());
        }
        if (user.length <= 0) {
            return cb(responseStruct.merge({
                signature: data.req.signature,
                action: "user_login",
                status: 401,
                success: false,
                message: "Invalid ID and Password Combination.",
            }).toJS());
        } else {
            return cb(null,
                responseStruct.merge({
                    signature: data.req.signature,
                    action: "user_login",
                    status: 200,
                    success: true,
                    message: "",
                    data: user[0]
                }).toJS());
        }
    });
};


const comparePassword = function (data, response, cb) {
    if (!cb) {
        cb = response;
    }
    let hash = null
    if (response.data) {
        hash = response.data.password;
    } else {
        console.log("no hash");
        return cb(responseStruct.merge({
            signature: data.req.signature,
            action: "user_login",
            status: 500,
            success: false,
            message: "Something went wrong!",
        }).toJS());
    }
    utilities.comparePassword(data.password, hash, function (err, hash_result) {
        if (err) {
            return cb(responseStruct.merge({
                signature: data.req.signature,
                action: "user_login",
                status: 500,
                success: false,
                message: "Something went wrong!",
            }).toJS());
        }
        if (hash_result === true) {
            return cb(null,
                responseStruct.merge({
                    signature: data.req.signature,
                    action: "user_login",
                    status: 200,
                    success: true,
                    message: "Username - Password Matches",
                    data: response.data
                }).toJS());
        } else {
            return cb(responseStruct.merge({
                signature: data.req.signature,
                action: "user_login",
                status: 401,
                success: false,
                message: "Invalid ID and Password Combination.",
            }).toJS());
        }
    });
};


const updateLoginInfo = function (data, response, cb) {
    if (!cb) {
        cb = response;
    }
    let login_req = {
        id: response.data.id
    };

    users.updateLoginInfo(login_req, function (err, user) {
        if (err) {
            console.log(err);
        }
    });

    return cb(null,
        responseStruct.merge({
            signature: data.req.signature,
            action: "user_login",
            status: 200,
            success: true,
            message: "Username - Password Matches",
            data: response.data
        }).toJS());
};


const encryptData = function (data, response, cb) {
    let timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    if (!cb) {
        cb = response;
    }
    let user_data = {
        id: response.data.id,
        email: response.data.email,
        accountId: response.data.accountId,
        name: response.data.name,
        created_at: Date.now(),
        token_type: "auth",
        mobile: response.data.mobile,
    };
    const encKey = response.data.salt;
    utilities.encryptData(user_data, encKey, function (err, cipher) {
        if (err) {
            console.log(err);
            return cb(responseStruct.merge({
                signature: data.req.signature,
                action: "user_login",
                status: 500,
                success: false,
                message: "Something went wrong!",
            }).toJS());
        }
        return cb(null,
            responseStruct.merge({
                signature: data.req.signature,
                action: "user_login",
                status: 200,
                success: true,
                message: "Successfully Logged In!",
                data: {
                    email: response.data.email,
                    accountId: response.data.accountId,
                    name: response.data.name,
                    mobile: response.data.mobile,
                    isNumberVerified: response.data.isNumberVerified,
                    sessionToken: cipher
                }
            }).toJS());
    });
};

const socialLogin = function (data, cb) {
    if (!data.social_id || !data.loginType || !data.social_token) {
        return cb(
            responseStruct.merge({
                signature: data.req.signature,
                action: "socialLogin",
                status: 400,
                success: false,
                message: "Params Missing",
            }).toJS());
    }

    let facebookData = {
        loginType: "facebook",
        facebook_token: data.social_token,
        facebook_id: data.social_id,
        req: data.req
    };

    async.waterfall([
        async.apply(validateSocialToken, facebookData),
        async.apply(getFBdetails, facebookData),
        async.apply(socialLoginOrSignup, facebookData),
    ], cb);
}

exports.socialLogin = socialLogin;

const validateSocialToken = function (data, response, cb) {
    if (!cb) {
        cb = response;
    }

    let fbToken = "";

    // console.log(data)

    if (data.facebook_token) {
        if (data.facebook_token.length > 0) {
            fbToken = data.facebook_token;
            if (fbToken.length <= 0) {
                return cb(
                    responseStruct.merge({
                        signature: data.req.signature,
                        action: "social_login",
                        status: 400,
                        success: false,
                        message: "Invalid Token",
                    }).toJS());
            } else {
                socialVerify.verifyFacebookToken(fbToken, function (isTokenValid) {
                    if (!isTokenValid) {
                        console.log("invalid facebook token");
                        return cb(
                            responseStruct.merge({
                                signature: data.req.signature,
                                action: "social_login",
                                status: 400,
                                success: false,
                                message: "Invalid Token",
                            }).toJS());
                    } else {
                        console.log("User verified facebook");
                        let response_object = {
                            provider: "facebook",
                            isValid: true
                        };

                        return cb(null,
                            responseStruct.merge({
                                signature: data.req.signature,
                                action: "social_login",
                                status: 200,
                                success: false,
                                message: "",
                                data: response_object
                            }).toJS());
                    }
                });
            }
        }
    }
};

// GET User details
const getFBdetails = function (data, response, cb) {
    if (!cb) {
        cb = response;
    }
    let token = "";

    if (data.facebook_token.length > 0) {
        token = data.facebook_token;
        if (token.length <= 0) {
            return cb(
                responseStruct.merge({
                    signature: data.req.signature,
                    action: "getFBdetails",
                    status: 400,
                    success: false,
                    message: "Invalid Token",
                }).toJS());
        } else {
            users.getUserDetails(token, function (result) {
                if (result.error) {
                    console.log("Invalid Permissions", result);
                    return cb(
                        responseStruct.merge({
                            signature: data.req.signature,
                            action: "getFBdetails",
                            status: 400,
                            success: false,
                            message: "Invalid Permissions"
                        }).toJS());
                } else {

                    let formatted_result = {
                        name: result.first_name + result.last_name,
                        email: result.email,
                        id: result.id,
                        gender: result.gender
                    }
                    if (result.picture.data) {
                        if (result.picture.data.url) {
                            formatted_result.displayPicture = result.picture.data.url;
                            formatted_result.profilePicture = result.picture.data.url;
                        }
                    }
                    if (result.birthday) {
                        let b_arr = result.birthday.split('/');
                        formatted_result.birthday = `${b_arr[2]}-${b_arr[1]}-${b_arr[0]}`
                    }
                    return cb(null,
                        responseStruct.merge({
                            signature: data.req.signature,
                            action: "getFBdetails",
                            status: 200,
                            success: false,
                            message: "ok",
                            data: formatted_result
                        }).toJS());
                }
            });
        }
    }
};


const socialLoginOrSignup = function (data, response, cb) {
    if (!cb) {
        cb = response;
    }
    let userData = response.data;
    userData.req = data.req;
    userData.loginType = data.loginType;
    userData.facebook_token = data.facebook_token;
    userData.facebook_id = data.facebook_id;
    users.getByEmail(userData, function (err, res) {
        if (err) {
            console.log(err);
            return cb(
                responseStruct.merge({
                    signature: userData.req.signature,
                    action: "socialLoginOrSignup",
                    status: 500,
                    success: false,
                    message: "Something went wrong",
                }).toJS());
        }

        if (res.length <= 0) {
            // Sign Up
            user_signup(userData, cb);
        } else {
            let userDBData = res[0];
            // Login
            let update_payload = {
                name: userData.name,
                email: userData.email,
                id: userDBData.id,
                req: data.req
            };

            update_payload.fbId = data.facebook_id;
            update_payload.fbToken = data.facebook_token;
            update_payload.loginType = data.loginType;

            users.updateSocialLogin(update_payload, function (err) {
                if (err) {
                    console.log(err);
                    return cb(
                        responseStruct.merge({
                            signature: data.req.signature,
                            action: "socialLoginOrSignup",
                            status: 500,
                            success: false,
                            message: "Something went wrong",
                        }).toJS());
                }

                // call login
                user_login(update_payload, cb, "VERIFIED");
            })
        }
    });
};


const updateToken = function (data, cb) {
    if (!data.appleToken) {
        return cb(
            responseStruct.merge({
                signature: data.req.signature,
                action: "updateToken",
                status: 400,
                success: false,
                message: "Params Missing",
            }).toJS());
    }

    async.waterfall([
        async.apply(getUserStoreFrontId, data),
        async.apply(addToken, data),
        async.apply(getUserApplePlaylist, data),
        async.apply(getUserPlaylistTracks, data),
        // async.apply(addPlaylistTracks, data),
    ], cb);
}

exports.updateToken = updateToken;

const getUserStoreFrontId = function (data, response, cb) {
    if (!cb) {
        cb = response;
    }
    let url = `https://api.music.apple.com/v1/me/storefront`;

    request({
        headers: {
            'Authorization': 'Bearer ' + process.env.DEVELOPER_TOKEN,
            'Music-User-Token': 'AjBfDqofYOLcAcy4Rx/aAS9VB2DeI0AvnYIo5ge7mZhE5vzLDXxeTI1yL+UGb2nFUsyeT1kV075gsAYGpi5SI9BxdepIO/DhKFvcTPBO/NWM4xQsHHvoe0nKyOEBnbk/NLB/5hGswIv5bm59GKPp8cUZtZwypkNBObWon/cteEVUZuv/u1Cr8mNVhZB4sMvbSuAPhe0Fw55aVOeZeKmbAGgjP80Xi0NyZOKMQcQVCIyZ9YrXvA==',
        },
        uri: url,
        method: 'GET'
    }, function (error, response, body) {
        // console.log('statusCode:', response );
        // console.log('body:', JSON.parse(response.body));
        let data = JSON.parse(response.body);
        let storeFrontId = data.data[0].id;
        if (error) {
            console.error(error);
            return cb(
                responseStruct.merge({
                    action: "getUserStoreFrontId",
                    status: 400,
                    success: false,
                    message: "Cannot get playlist",
                }).toJS());
        } else {
            return cb(null,
                responseStruct.merge({
                    action: "getUserStoreFrontId",
                    status: 200,
                    success: true,
                    message: "Store Front Id",
                    data: storeFrontId
                }).toJS());
        }
    });
};

exports.getUserStoreFrontId = getUserStoreFrontId;


const addToken = function (data, response, cb) {
    if (!cb) {
        cb = response;
    }

    let token_req = {
        user: data.req.auth.id,
        appleToken: data.appleToken,
        storeFrontId: response.data
    };


    // users.updateToken(token_req, function (err, user) {
    //     if (err) {
    //         console.log(err);
    //     }
    // });

    return cb(null,
        responseStruct.merge({
            signature: data.req.signature,
            action: "updateToken",
            status: 200,
            success: true,
            message: "Token Updated",
            data: response.data
        }).toJS());
};

exports.addToken = addToken;

const getUserApplePlaylist = function (data, response, cb) {
    if (!cb) {
        cb = response;
    }

    let url = `https://api.music.apple.com/v1/me/library/playlists?limit=100`;

    request({
        headers: {
            'Authorization': 'Bearer ' + process.env.DEVELOPER_TOKEN,
            'Music-User-Token': 'AjBfDqofYOLcAcy4Rx/aAS9VB2DeI0AvnYIo5ge7mZhE5vzLDXxeTI1yL+UGb2nFUsyeT1kV075gsAYGpi5SI9BxdepIO/DhKFvcTPBO/NWM4xQsHHvoe0nKyOEBnbk/NLB/5hGswIv5bm59GKPp8cUZtZwypkNBObWon/cteEVUZuv/u1Cr8mNVhZB4sMvbSuAPhe0Fw55aVOeZeKmbAGgjP80Xi0NyZOKMQcQVCIyZ9YrXvA==',
        },
        uri: url,
        method: 'GET'
    }, function (error, res, body) {
        // console.log('statusCode:', response );
        // console.log('body:', JSON.parse(response.body));
        let data = JSON.parse(res.body);
        if (error) {
            console.error(error);
            return cb(
                responseStruct.merge({
                    action: "getUserApplePlaylist",
                    status: 400,
                    success: false,
                    message: "Cannot get playlist",
                }).toJS());
        } else {
            return cb(null,
                responseStruct.merge({
                    action: "getUserApplePlaylist",
                    status: 200,
                    success: true,
                    message: "Apple Playlist",
                    data: {
                        storeFrontId: response.data,
                        userApplePlaylist: data
                    }
                }).toJS());
        }
    });
};

exports.getUserApplePlaylist = getUserApplePlaylist;

const getUserPlaylistTracks = function (data, response, cb) {
    if (!cb) {
        cb = response;
    }

    let storeFrontId = response.data.storeFrontId;
    let userApplePlaylist = response.data.userApplePlaylist.data;

    let playlist = [];
    let count = 0;

    for (let i in userApplePlaylist) {
        let applePlaylist = {
            id: userApplePlaylist[i].id,
            playlistName: userApplePlaylist[i].attributes.name,
            artwork: userApplePlaylist[i].attributes.artwork.url,
            tracks: []
        };
        if (userApplePlaylist[i].attributes.description) {
            applePlaylist.playlistDescription = userApplePlaylist[i].attributes.description.standard
        } else {
            applePlaylist.playlistDescription = "No description"
        }

        playlist.push(applePlaylist);
        let url = `https://api.music.apple.com/v1/me/library/playlists/${userApplePlaylist[i].id}?include=tracks`;
        request({
            headers: {
                'Authorization': 'Bearer ' + process.env.DEVELOPER_TOKEN,
                'Music-User-Token': 'AjBfDqofYOLcAcy4Rx/aAS9VB2DeI0AvnYIo5ge7mZhE5vzLDXxeTI1yL+UGb2nFUsyeT1kV075gsAYGpi5SI9BxdepIO/DhKFvcTPBO/NWM4xQsHHvoe0nKyOEBnbk/NLB/5hGswIv5bm59GKPp8cUZtZwypkNBObWon/cteEVUZuv/u1Cr8mNVhZB4sMvbSuAPhe0Fw55aVOeZeKmbAGgjP80Xi0NyZOKMQcQVCIyZ9YrXvA==',
            },
            uri: url,
            method: 'GET'
        }, function (error, res, body) {
            let parseData = JSON.parse(res.body);
            let tracksData = parseData.data[0].relationships.tracks.data;
            count++;
            if (error) {
                console.error(error);
                return cb(
                    responseStruct.merge({
                        action: "getUserApplePlaylistTracks",
                        status: 400,
                        success: false,
                        message: "Cannot get playlist tracks",
                    }).toJS());
            } else {
                for (let k in tracksData) {
                    const appleTrack = {
                        id: tracksData[k].id,
                        name: tracksData[k].attributes.name,
                        duration: tracksData[k].attributes.durationInMillis,
                        artistName: tracksData[k].attributes.artistName,
                        artwork: tracksData[k].attributes.artwork.url,
                    };
                    playlist[i].tracks.push(appleTrack);
                }
                if (count === userApplePlaylist.length) {
                    return cb(null,
                        responseStruct.merge({
                            action: "getUserApplePlaylist",
                            status: 200,
                            success: true,
                            message: "Apple Playlist",
                            data: {
                                storeFrontId: storeFrontId,
                                playlist: playlist
                            }
                        }).toJS());
                }
            }
        });

    }

};


exports.getUserPlaylistTracks = getUserPlaylistTracks;








