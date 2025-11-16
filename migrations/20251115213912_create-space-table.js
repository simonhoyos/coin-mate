/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('space', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.timestamps(true, true);

    table.string('name').notNullable();
    table.text('description');

    table.uuid('user_id').references('user.id');

    table.timestamp('archived_at').nullable();

    table.unique(['name', 'user_id'], {
      indexName: 'space_active_unique_idx',
      predicate: knex.whereNull('archived_at'),
    });
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('space');
}
