let db = require('./db');
let moment = require('moment');

module.exports = function(table) {
    return {
        entryExists : function(where, type, done) {
            if(!done){
                done = type;
            }
            let queryBuilder = db.count('id AS count').from(table);
            if(Array.isArray(where) && where.length > 0){
                for(let i in where){
                    if(i === 0){
                        queryBuilder = queryBuilder.where(where[i]);
                    }else{
                        if(type === 'and'){
                            queryBuilder = queryBuilder.andWhere(where[i]);
                        }else{
                            queryBuilder = queryBuilder.orWhere(where[i]);
                        }

                    }
                }
            }else{
                queryBuilder = queryBuilder.where(where);
            }

            queryBuilder.asCallback(function(err, result) {
                if (err) {
                    console.log(queryBuilder.toSQL().sql);
                    console.log(err);
                    return done(err);
                }
                if(result.length > 0){
                    return done(null, result[0])
                }else{
                    return done(new Error("something went wrong"))
                }
            });
        },
        readByKeyValue : function(data, done){
            let timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
            let queryBuilder = db.select(data.selectors || '*').from(table);
            queryBuilder = queryBuilder.where(data.key, data.value);
            queryBuilder.asCallback(function(err, result) {
                if (err) {
                    return done(err);
                }
                // console.log("result",result)
                done(null, result)
            });
        },
        readByID : function(data, done){
            let queryBuilder = db.select().from(table);
            queryBuilder = queryBuilder.where("id", data.id);
            queryBuilder.asCallback(function(err, result) {
                if (err) {
                    console.log(err);
                    return done(err);
                }
                done(null, result)
            });
        }
    }
};