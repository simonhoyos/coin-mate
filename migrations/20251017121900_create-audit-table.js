/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('audit', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.timestamps(true, true);

    table.uuid('user_id').references('user.id');

    table.text('object').notNullable();
    table.text('object_id').notNullable();
    table.text('operation').notNullable();

    table.jsonb('data').notNullable();
    table.jsonb('metadata').notNullable();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('audit');
}
