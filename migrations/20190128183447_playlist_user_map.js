exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTable('playlist_user_map', function(table) {
            table.increments();
            table.integer('user').unsigned().index().references('id').inTable('users').onDelete('CASCADE').onUpdate('CASCADE');
            table.integer('playlist').unsigned().index().references('id').inTable('playlists').onDelete('CASCADE').onUpdate('CASCADE');
            table.integer('permission',5);
            table.timestamps();
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('playlist_user_map')
    ])
};
