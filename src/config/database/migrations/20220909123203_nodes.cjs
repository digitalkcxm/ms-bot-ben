exports.up = (knex, Promise) => {
    return knex.schema.createTable('nodes', (table) => {
      table.uuid('id').unique().notNullable().primary().defaultTo(knex.raw('gen_random_uuid ()'))
      table.uuid('ia_id').notNullable().unsigned()
      table.string('title')
      table.json('conditions')
      table.json('actions')
      table.string('response')
      table.json('next_move')
      table.uuid('previous_node')
      table.boolean('active').defaultTo(true)
      table.timestamps(true, true)
      table.foreign('ia_id').references('ia.id')
    })
  }
  
  exports.down = (knex, Promise) => knex.schema.dropTableIfExists('nodes')