/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('transaction_ledger', (table) => {
    table.uuid('space_id').references('space.id').nullable();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('transaction_ledger', (table) => {
    table.dropColumn('space_id');
  });
}
