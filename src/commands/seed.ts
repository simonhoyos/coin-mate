import { createRequire } from 'node:module';
import { Command } from 'commander';
import { subDays } from 'date-fns';
import { assertNotNull } from '@/lib/assert';
import type { CategoryColor, CategoryIconKey } from '@/lib/category-appearance';
import { createContextInner } from '@/lib/context.js';
import { createCategory } from '@/lib/testing/factories/category';
import { createSpace } from '@/lib/testing/factories/space';
import { createTransactionLedger } from '@/lib/testing/factories/transaction-ledger';
import { createUser } from '@/lib/testing/factories/user';

const CATEGORY_APPEARANCES: Record<
  string,
  { icon: CategoryIconKey; color: CategoryColor }
> = {
  'Food & Dining': { icon: 'tools-kitchen-2', color: '#f97316' },
  Groceries: { icon: 'shopping-cart', color: '#22c55e' },
  Transportation: { icon: 'bus', color: '#3b82f6' },
  Housing: { icon: 'home', color: '#6366f1' },
  Utilities: { icon: 'bolt', color: '#eab308' },
  Entertainment: { icon: 'movie', color: '#a855f7' },
  'Health & Fitness': { icon: 'barbell', color: '#ef4444' },
  Shopping: { icon: 'shirt', color: '#ec4899' },
  'Personal Care': { icon: 'heart', color: '#ec4899' },
  Education: { icon: 'school', color: '#06b6d4' },
  Travel: { icon: 'plane', color: '#14b8a6' },
  'Gifts & Donations': { icon: 'gift', color: '#f59e0b' },
  Investments: { icon: 'building-bank', color: '#3b82f6' },
  Savings: { icon: 'pig-money', color: '#22c55e' },
  'Debt Repayment': { icon: 'credit-card', color: '#ef4444' },
  Insurance: { icon: 'first-aid-kit', color: '#06b6d4' },
  Taxes: { icon: 'receipt', color: '#6b7280' },
  'Business Services': { icon: 'briefcase', color: '#6366f1' },
  Software: { icon: 'device-mobile', color: '#14b8a6' },
};

const program = new Command();

const require = createRequire(import.meta.url);
const { version } = require('../../package.json') as { version: string };

program
  .name('db:seed')
  .description('Seed the database with a user, categories, and transactions')
  .version(version)
  .showHelpAfterError()
  .showSuggestionAfterError()
  .argument('[name]', 'Name of the user to seed')
  .action(async (name: string | undefined) => {
    const context = await createContextInner();

    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl == null || databaseUrl.includes('localhost') !== true) {
      throw new Error('Cannot run seeds on a non-local database');
    }

    try {
      const userName = name ?? `demo+${Date.now()}`;
      const email = `${userName}@coinmate.com`;
      const password = 'Test-password123';

      console.log(`Seeding data for user: ${email}...`);

      // 1. Create User
      const user = await createUser(context.services.knex, {
        email,
        password,
      });

      const userId = assertNotNull(user?.id, 'Failed to create user');
      console.log(`Created user with ID: ${userId}`);

      // 2. Create Space
      const space = await createSpace(context.services.knex, {
        user_id: userId,
        name: `${userName}'s Space`,
      });

      const spaceId = assertNotNull(space?.id, 'Failed to create space');
      console.log(`Created space with ID: ${spaceId}`);

      // 3. Create Categories
      const categories = await Promise.all(
        [
          'Food & Dining',
          'Groceries',
          'Transportation',
          'Housing',
          'Utilities',
          'Entertainment',
          'Health & Fitness',
          'Shopping',
          'Personal Care',
          'Education',
          'Travel',
          'Gifts & Donations',
          'Investments',
          'Savings',
          'Debt Repayment',
          'Insurance',
          'Taxes',
          'Business Services',
          'Software',
          'Miscellaneous',
        ].map(async (categoryName) =>
          createCategory(context.services.knex, {
            user_id: userId,
            space_id: spaceId,
            name: categoryName,
            ...CATEGORY_APPEARANCES[categoryName],
          }),
        ),
      );

      console.log(`Created ${categories.length} categories`);

      // 4. Create Transactions
      const transactionCount = 200;
      console.log(`Creating ${transactionCount} transactions...`);

      const transactions = await Promise.all(
        [...Array(transactionCount)].map(async (_, i) =>
          createTransactionLedger(context.services.knex, {
            user_id: userId,
            space_id: spaceId,

            category_id: assertNotNull(
              categories[Math.floor(Math.random() * categories.length)],
            )?.id,

            // Random amount between 10.00 and 500.00
            amount_cents: Math.floor(Math.random() * 49000) + 1000,
            original_amount_cents: Math.floor(Math.random() * 49000) + 1000,

            // Random date within the last year
            transacted_at: subDays(
              new Date(),
              Math.floor(Math.random() * 365),
            ).toISOString(),
            concept: `Transaction ${i + 1}`,
          }),
        ),
      );

      console.log(`Created ${transactions.length} transactions`);

      console.log('Seeding complete!');
    } catch (error) {
      console.error('Seeding failed:', error);
      process.exit(1);
    } finally {
      await context.cleanup();
    }
  });

program.parseAsync().catch((error) => {
  console.error(error);
  process.exit(1);
});
