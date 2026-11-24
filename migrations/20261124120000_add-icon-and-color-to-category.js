/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('category', (table) => {
    table.string('icon', 64).nullable();
    table.string('color', 7).nullable();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('category', (table) => {
    table.dropColumn('icon');
    table.dropColumn('color');
  });
}
