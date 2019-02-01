exports.up = function(knex, Promise) {
    return Promise.all([
        knex.raw(`ALTER TABLE users ADD appleToken VARCHAR(500);`)
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.raw('ALTER TABLE users DROP COLUMN appleToken;')
    ])
};