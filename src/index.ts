import { Command } from "commander";
import { parse } from "csv-parse";
import { createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

type ExpenseCsvRow = {
  Timestamp: string;
  Merchant: string;
  Amount: string;
  MCC?: string;
  Category?: string;
  Tag?: string;
  Comment?: string;
  Reimbursable?: string;
  "Original Currency"?: string;
  "Original Amount"?: string;
  Receipt?: string;
  Attendees?: string;
};

type ExpenseRecord = {
  timestamp: string;
  merchant: string;
  amount: number;
  mcc: string | null;
  category: string | null;
  tag: string | null;
  comment: string | null;
  reimbursable: boolean;
  originalCurrency: string | null;
  originalAmount: number;
  receipt: string | null;
  attendees: string[];
};

const normalizeString = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

const parseRequired = (
  value: string | null | undefined,
  fieldName: string,
): string => {
  const normalized = normalizeString(value);
  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  return normalized;
};

const parseNumber = (
  value: string | null | undefined,
  fieldName: string,
): number => {
  const raw = parseRequired(value, fieldName);
  const trimmed = raw.trim();
  const isParenthesizedNegative = /^\(.*\)$/.test(trimmed);
  const withoutParens = isParenthesizedNegative
    ? trimmed.slice(1, -1)
    : trimmed;
  const sanitized = withoutParens.replace(/[$,\s]/g, "");
  const parsed = Number.parseFloat(sanitized);

  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid ${fieldName.toLowerCase()}: "${value}"`);
  }

  return isParenthesizedNegative ? -parsed : parsed;
};

const parseReimbursable = (value: string | null | undefined): boolean => {
  const normalized = normalizeString(value);
  if (!normalized) {
    return false;
  }

  const token = normalized.toLowerCase();
  if (["true", "yes", "y", "1"].includes(token)) {
    return true;
  }

  if (["false", "no", "n", "0"].includes(token)) {
    return false;
  }

  return false;
};

const parseAttendees = (value: string | null | undefined): string[] => {
  const normalized = normalizeString(value);
  if (!normalized) {
    return [];
  }

  const parts = normalized.split(/[;,]/);
  return parts
    .map((part) => part.trim())
    .filter((part): part is string => part.length > 0);
};

const mapExpense = (row: ExpenseCsvRow): ExpenseRecord => ({
  // timestamp: parseRequired(row.Timestamp, "Timestamp"),
  timestamp: Date.now().toString(), // Using current time as a placeholder
  merchant: parseRequired(row.Merchant, "Merchant"),
  amount: parseNumber(row.Amount, "Amount"),
  mcc: normalizeString(row.MCC),
  category: normalizeString(row.Category),
  tag: normalizeString(row.Tag),
  comment: normalizeString(row.Comment),
  reimbursable: parseReimbursable(row.Reimbursable),
  originalCurrency: normalizeString(row["Original Currency"]),
  originalAmount: parseNumber(row["Original Amount"], "Original Amount"),
  receipt: normalizeString(row.Receipt),
  attendees: parseAttendees(row.Attendees),
});

const parseExpensesFile = async (
  filePath: string,
): Promise<ExpenseRecord[]> => {
  const records: ExpenseRecord[] = [];
  const parser = parse<ExpenseCsvRow>({
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  parser.on("data", (row: ExpenseCsvRow) => {
    try {
      records.push(mapExpense(row));
    } catch (error) {
      parser.destroy(error as Error);
    }
  });

  await pipeline(createReadStream(filePath, { encoding: "utf8" }), parser);

  return records;
};

const program = new Command();

program
  .name("coin-mate")
  .description("CLI utilities for the coin-mate project")
  .version(version)
  .showHelpAfterError()
  .showSuggestionAfterError();

program
  .command("parse-expenses")
  .description("Parse an expenses CSV and print normalized JSON records")
  .argument("<file>", "path to the expenses CSV file")
  .action(async (file: string) => {
    try {
      const records = await parseExpensesFile(file);
      process.stdout.write(`${JSON.stringify(records, null, 2)}\n`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      program.error(message);
    }
  });

void program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  program.error(message);
});
