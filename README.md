# Coin Mate

Coin Mate is a personal finance management application designed to help users track, categorize, and visualize their expenses. It provides a comprehensive dashboard for gaining insights into spending habits and managing financial data efficiently.

## Architecture

This project is built with the following technologies:

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Frontend Library:** [React](https://react.dev/)
- **API:** [GraphQL](https://graphql.org/) with [Apollo Server](https://www.apollographql.com/docs/apollo-server/) and [Apollo Client](https://www.apollographql.com/docs/react/)
- **Database:** [CockroachDB](https://www.cockroachlabs.com/)
- **Query Builder & Migrations:** [Knex.js](https://knexjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) and [Radix UI](https://www.radix-ui.com/)
- **Form Management:** [React Hook Form](https://react-hook-form.com/)
- **Validation:** [Zod](https://zod.dev/)
- **Data Visualization:** [Recharts](https://recharts.org/)
- **Code Quality:** [Biome](https://biomejs.dev/) (Linting and Formatting)
- **Containerization:** [Docker](https://www.docker.com/)

## Prerequisites

Before you begin, ensure you have the following installed:

-   [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager)
-   [Node.js](https://nodejs.org/) (Managed via `nvm`)
-   [pnpm](https://pnpm.io/) (Package manager)
-   [Docker](https://www.docker.com/) (For running the local database)

## Getting Started

### 1. Clone the repository

```bash
git clone git@github.com/simonhoyos/coin-mate.git
cd coin-mate
```

### 2. Set Node.js version

Ensure you are using the version of Node.js specified in `.nvmrc`:

```bash
nvm use
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Environment Configuration

Create a `.env.local` file in the root directory. You can use the following template:

```bash
DATABASE_URL="postgresql://root@localhost:26257/defaultdb?sslmode=disable"
JWT_SECRET="super-secret-key-that-is-at-least-32-chars-long"
```

*   `DATABASE_URL`: Connection string for the database. The default above works with the provided Docker Compose setup.
*   `JWT_SECRET`: Secret key for signing JWTs. Must be at least 32 characters long. [JWT secret generator](https://jwtsecrets.com/)

### 5. Start the Database

Start the local CockroachDB instance using Docker Compose:

```bash
docker compose up -d
```

### 6. Run Database Migrations

Initialize the database schema. Since `DATABASE_URL` is required, you can either define it in the command or use `dotenv-cli` to read from `.env.local`:

```bash
# Option 1: Define it in the command
DATABASE_URL="postgresql://root@localhost:26257/defaultdb?sslmode=disable" pnpm exec knex migrate:latest

# Option 2: Use dotenv-cli via pnpm
pnpm dotenv -e .env.local -- pnpm exec knex migrate:latest
```

### 7. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

-   `pnpm dev`: Starts the development server with Turbopack.
-   `pnpm build`: Builds the application for production.
-   `pnpm start`: Starts the production server.
-   `pnpm format`: Formats code using Biome.
-   `pnpm check:lint`: run linting checks.
-   `pnpm check:format`: run formatting checks.
-   `pnpm check:types`: run type checking.
-   `pnpm check:all`: Runs linting, formatting checks, and type checking.

## CLI Utilities

The project includes CLI utilities for processing expense data. You can run them using `pnpm dlx tsx` (if installed) or by compiling the project.

Example:
```bash
# Basic usage
pnpm dlx tsx src/commands/index.ts --help

# If a command requires environment variables (e.g., for database access)
pnpm dotenv -e .env.local -- pnpm dlx tsx src/commands/index.ts <command>
```
