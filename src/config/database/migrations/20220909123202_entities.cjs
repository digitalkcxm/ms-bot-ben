exports.up = (knex, Promise) => {
    return knex.schema.createTable('entities', (table) => {
      table.uuid('id').unique().notNullable().primary().defaultTo(knex.raw('gen_random_uuid ()'))
      table.uuid('ia_id').notNullable().unsigned()
      table.string('entity')
      table.json('value')
      table.string('type')
      table.boolean('active').defaultTo(true)
      table.timestamps(true, true)
      table.foreign('ia_id').references('ia.id')
    })
  }
  
  exports.down = (knex, Promise) => knex.schema.dropTableIfExists('entities')