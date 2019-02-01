exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTable('playlists', function(table) {
            table.increments();
            table.string('name',50).nullable();
            table.string('description',100).nullable();
            table.string('albumArt',256).nullable();
            table.integer('user').unsigned().index().references('id').inTable('users').onDelete('CASCADE').onUpdate('CASCADE');
            table.string('applePlaylistId',100).nullable();
            table.boolean('isDeleted').defaultTo(0);
            table.timestamps();
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('playlists')
    ])
};
