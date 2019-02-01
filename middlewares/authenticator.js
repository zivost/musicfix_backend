'use strict'

const teade = require('teade'); // used to communicate with services

let usersClient = {
	create: function(users) {
	    var host = users.host;
		var port = users.port;
		var client = new teade.Client(host, port);
		return client;
	}
}

module.exports = function(clients, data) {
    return function(req, res, next) {
        // return next();
        // import user client
        var users = usersClient.create(clients.users);
                
        res.set('x-powered-by', "MusicFix App Core");

        if(!req.data.request){
            console.log("Invalid Request");
            var response = {
                success: false,
                message: 'Failed to authenticate token at Lv0'
            };
            return res.status(401).send(response);
        }
        let user_request = req.data.request;
        let user_ip = user_request.ip;
        let token = req.headers['x-access-token'];
        let identifier = req.headers['x-access-user'];
        let expired_token = req.headers['x-expired-token'];
        let device_id = req.headers['x-device_id'];
        let device_session = req.headers['x-device_session'];

        // console.log("auth",token, identifier, user_ip);
        if (token && identifier && user_ip) {
            // verify the token
            let payload = {
                token: token,
                identifier: identifier,
                req: req.data,
                user_ip: user_ip,
                expired_token: expired_token,
                device_id: device_id,
                device_session: device_session
            }
            users.request('validate_token', payload, function(err, response) {
                if (err) {
                    console.log(err);
                    var response = {
                        success: false,
                        message: 'Failed to authenticate token at Lv2'
                    };
                    return res.status(401).send(response);
                } else {
                    if (response.data) {
                        if (response.data.token) {
                            res.set('Refresh-Token', response.data.token);
                            res.set('X-Refresh-Token', response.data.token);
                        }
                    }
                    // if everything is good, save to request for use in other routes
                    req.data.auth = response.data;
                    req.data.auth.token = token;
                    req.data.auth.identifier = identifier;
                    next();
                }
            });
        } else {
            // if there is no token
            // return an error
            var response = {
                success: false,
                message: 'Not Authorized'
            };
            return res.status(401).send(response);
        }

    }
}