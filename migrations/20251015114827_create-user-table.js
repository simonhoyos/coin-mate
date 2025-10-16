/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('user', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.timestamps(true, true);

    table.text('email').notNullable().unique();
    table.text('password').notNullable();
  });

  await knex.raw(`
    CREATE OR REPLACE FUNCTION set_user_updated_at() RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER set_user_updated_at_trigger
    BEFORE UPDATE ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION set_user_updated_at();
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw(
    'DROP TRIGGER IF EXISTS set_user_updated_at_trigger ON "user";',
  );
  await knex.raw('DROP FUNCTION IF EXISTS set_user_updated_at();');
  await knex.schema.dropTableIfExists('user');
}
