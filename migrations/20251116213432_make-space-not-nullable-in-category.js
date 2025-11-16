/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('category', (table) => {
    table.uuid('space_id').notNullable().alter({ alterType: false });

    table.dropIndex(['name', 'user_id'], 'category_active_unique_idx');

    table.unique(['name', 'space_id', 'user_id'], {
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
  await knex.schema.alterTable('category', (table) => {
    table.uuid('space_id').nullable().alter({ alterType: false });

    table.dropIndex(['name', 'user_id'], 'category_active_unique_idx');

    table.unique(['name', 'user_id'], {
      indexName: 'category_active_unique_idx',
      predicate: knex.whereNull('archived_at'),
    });
  });
}
