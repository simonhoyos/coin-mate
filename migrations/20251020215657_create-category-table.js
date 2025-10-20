/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('category', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.timestamps(true, true);

    table.text('name').notNullable();
    table.text('description').nullable();

    table.uuid('user_id').references('user.id').notNullable();

    table.timestamp('archived_at').nullable();

    table.unique(['name', 'user_id'], {
      indexName: 'category_active_unique_idx',
      predicate: knex.whereNull('archived_at'),
    });
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('category');
}
