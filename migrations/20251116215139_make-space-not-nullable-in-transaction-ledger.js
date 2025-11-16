/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('transaction_ledger', (table) => {
    table.uuid('space_id').notNullable().alter({ alterType: false });
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('transaction_ledger', (table) => {
    table.uuid('space_id').nullable().alter({ alterType: false });
  });
}
