exports.up = (knex) => {
    return knex.schema.table('nodes', table => {
        table.json('context');
    })
}

exports.down = (knex) => { }