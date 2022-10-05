exports.up = (knex, Promise) => {
    return knex.schema.createTable('ia', (table) => {
      table.uuid('id').unique().notNullable().primary().defaultTo(knex.raw('uuid_generate_v4()'))
      table.uuid('company_id').notNullable().unsigned()
      table.string('description')
      table.boolean('active').defaultTo(true)
      table.timestamps(true, true)
      //table.foreign('company_id').references('company.id')
    })
  }
  
  exports.down = (knex, Promise) => knex.schema.dropTableIfExists('ia')