/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('transaction_ledger', (table) => {
    table.text('original_currency').nullable();
    table.integer('original_amount_cents').nullable();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('transaction_ledger', (table) => {
    table.dropColumn('original_currency');
    table.dropColumn('original_amount_cents');
  });
}
