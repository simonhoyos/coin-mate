/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('space_user', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.timestamps(true, true);

    table.uuid('space_id').references('space.id').notNullable();
    table.uuid('user_id').references('user.id').notNullable();

    table.text('role').notNullable();

    table.timestamp('archived_at').nullable();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('space_user');
}
