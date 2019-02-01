exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTable('users', function(table) {
            table.increments();
            table.string('name',50).nullable();
            table.string('username',30).unique().nullable();
            table.string('accountId',13).unique();
            table.string('email',150).unique();
            table.string('password',1024);
            table.string('salt',500);
            table.string('socialId',100).nullable();
            table.string('socialToken',500).nullable();
            table.string('loginType',10).nullable();
            table.string('profilePicture',512);
            table.string('storeFrontId',3).nullable();
            table.string('mobile', 15).unique();
            table.boolean('isNumberVerified');
            table.boolean('isDisabled').defaultTo(0);
            table.boolean('isDeleted').defaultTo(0);
            table.dateTime('lastLogin');
            table.timestamps();
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('users')
    ])
};
