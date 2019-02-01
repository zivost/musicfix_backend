const db = require('../models/db');

module.exports = function(req, res, next) {
    var queryBuilder = db.raw('select 1');
    queryBuilder.asCallback(function(err, rows) {
        if (err){
            return res.status(400).send({
                success: false, 
                message: 'MySQL not running.'
            });
        }else{
            next();
        }
    });
}