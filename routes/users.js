const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

/* Controllers */
const users = require('../controllers/users');

/* Middlewares */
const formatRequest = require('../middlewares/formatRequest');
router.use(formatRequest);

const clients = {
    users: {
        host: process.env.SERVICE_RPC_HOST,
        port: process.env.MF_USER_PORT
    }
}

const data = {};
const authenticator = require('../middlewares/authenticator')(clients, data);

/* POST user joins. */
router.post('/v1/signup', function(req, res, next) {
    let data = req.body;
    data.req = req.data;

    users.user_signup(data, function(err, response) {
        let status = 0;
        if (err) {
            status = err.status;
            return res.status(status).send(err);
        }
        status = response.status;
        return res.status(status).send(response);
    });
});

/* POST user login. */
router.post('/v1/login', function(req, res, next) {
    let data = req.body;
    data.req = req.data;

    users.user_login(data, function(err, response) {
        let status = 0;
        if (err) {
            console.log(err);
            status = err.status;
            return res.status(status).send(err);
        }
        status = response.status;
        return res.status(status).send(response);
    }, "NOT_VERIFIED");
});

router.post('/v1/login/social', function(req, res, next) {
    let data = req.body;
    data.req = req.data;

    users.socialLogin(data, function(err, response) {
        let status = 0;
        if (err) {
            console.log(err);
            status = err.status;
            return res.status(status).send(err);
        }
        status = response.status;
        return res.status(status).send(response);
    });
});

router.patch('/v1/user/update/token', authenticator, function(req, res, next) {
    let data = req.body;
    data.req = req.data;

    users.updateToken(data, function(err, response) {
        let status = 0;
        if (err) {
            console.log(err);
            status = err.status;
            return res.status(status).send(err);
        }
        status = response.status;
        return res.status(status).send(response);
    });
});

module.exports = router;