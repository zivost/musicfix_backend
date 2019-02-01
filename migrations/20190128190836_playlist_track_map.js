exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTable('playlist_track_map', function(table) {
            table.increments();
            table.integer('track').unsigned().index().references('id').inTable('tracks').onDelete('CASCADE').onUpdate('CASCADE');
            table.integer('playlist').unsigned().index().references('id').inTable('playlists').onDelete('CASCADE').onUpdate('CASCADE');
            table.timestamps();
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('playlist_user_map')
    ])
};
