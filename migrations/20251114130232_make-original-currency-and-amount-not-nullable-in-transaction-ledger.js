/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('transaction_ledger', (table) => {
    table.text('original_currency').notNullable().alter({ alterType: false });
    table
      .integer('original_amount_cents')
      .notNullable()
      .alter({ alterType: false });
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('transaction_ledger', (table) => {
    table.text('original_currency').nullable().alter({ alterType: false });
    table
      .integer('original_amount_cents')
      .nullable()
      .alter({ alterType: false });
  });
}
