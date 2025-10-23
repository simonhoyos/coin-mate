/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('transaction_ledger', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.timestamps(true, true);

    table.text('concept').notNullable();
    table.text('description').nullable();
    table.text('currency').notNullable()
    table.integer('amount_cents').notNullable();
    table.timestamp('transacted_at').notNullable();

    table.uuid('user_id').references('user.id').notNullable();
    table.uuid('category_id').references('category.id').notNullable();

    table.timestamp('archived_at').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('transaction_ledger');
};
