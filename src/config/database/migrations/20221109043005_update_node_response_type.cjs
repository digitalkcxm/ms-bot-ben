exports.up = (knex) => {
    return knex.raw(`ALTER TABLE nodes ALTER COLUMN response type text;`)
}

exports.down = (knex) => { }