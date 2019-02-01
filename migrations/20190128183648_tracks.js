exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTable('tracks', function(table) {
            table.increments();
            table.string('name',100).nullable();
            table.string('appleTrackId',50).nullable();
            table.string('type',50).nullable();
            table.string('artwork',256).nullable();
            table.string('artistName',100).nullable();
            table.string('genre',100).nullable();
            table.string('duration',100).nullable();
            table.datetime('releasedDate').nullable();
            table.string('albumName',100).nullable();
            table.string('composerName',256).nullable();
            table.boolean('isDeleted').defaultTo(0);
            table.timestamps();
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('tracks')
    ])
};
