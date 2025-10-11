import { Command, InvalidOptionArgumentError } from "commander";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const parseCount = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    throw new InvalidOptionArgumentError("count must be a positive integer");
  }

  return parsed;
};

const program = new Command();

program
  .name("coin-mate")
  .description("CLI utilities for the coin-mate project")
  .version(version)
  .showHelpAfterError()
  .showSuggestionAfterError();

program
  .command("greet")
  .description("Send a friendly greeting")
  .argument("<name>", "person to greet")
  .option("-c, --count <number>", "repeat count", parseCount, 1)
  .action((name: string, options: { count: number }) => {
    for (let index = 0; index < options.count; index += 1) {
      process.stdout.write(`Hello, ${name}!\n`);
    }
  });

void program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  program.error(message);
});
