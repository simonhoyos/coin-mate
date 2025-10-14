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

type CategoryReport = {
  category: string;
  totalAmount: number;
  merchants: string[];
};

type MonthlyReport = Record<string, CategoryReport[]>;

type CategoryMonthlyStats = {
  category: string;
  monthlyAverageAmount: number;
  monthlyMedianAmount: number;
  monthlyTotals: Record<string, number>;
};

type MonthlyCategoryStatsReport = CategoryMonthlyStats[];

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
  timestamp: parseRequired(row.Timestamp, "Timestamp"),
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

const normalizeHeader = (header: string): string => header.replace(/\uFEFF/g, "").trim();

const getMonthKey = (timestamp: string): string => {
  const normalized = timestamp.replace(/\uFEFF/g, "").trim();

  if (normalized.length === 0) {
    throw new Error("Timestamp is required");
  }

  const isoMatch = normalized.match(/^(\d{4})[-/](\d{2})/);
  if (isoMatch) {
    const [, year, month] = isoMatch;
    return `${year}-${month}`;
  }

  const usMatch = normalized.match(/^(\d{1,2})[/](\d{1,2})[/](\d{2,4})/);
  if (usMatch) {
    const monthPart = usMatch[1]!;
    const yearPart = usMatch[3]!;
    const fullYear =
      yearPart.length === 2 ? `20${yearPart}` : yearPart.padStart(4, "0");
    return `${fullYear}-${String(Number.parseInt(monthPart, 10)).padStart(2, "0")}`;
  }

  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  throw new Error(`Unable to parse timestamp: "${timestamp}"`);
};

const buildMonthlyReport = (records: ExpenseRecord[]): MonthlyReport => {
  const monthMap = new Map<string, Map<string, { total: number; merchants: Set<string> }>>();

  for (const record of records) {
    const monthKey = getMonthKey(record.timestamp);
    const categoryKey = record.category ?? "Uncategorized";
    const merchant = record.merchant;
    const monthEntry = monthMap.get(monthKey) ?? new Map();
    const categoryEntry = monthEntry.get(categoryKey) ?? {
      total: 0,
      merchants: new Set<string>(),
    };

    categoryEntry.total += record.amount;
    if (merchant) {
      categoryEntry.merchants.add(merchant);
    }

    monthEntry.set(categoryKey, categoryEntry);
    monthMap.set(monthKey, monthEntry);
  }

  const report: MonthlyReport = {};
  const sortedMonths = [...monthMap.entries()].sort(([monthA], [monthB]) =>
    monthA.localeCompare(monthB),
  );

  for (const [month, categories] of sortedMonths) {
    const monthCategories: CategoryReport[] = [];
    for (const [category, { total, merchants }] of categories) {
      monthCategories.push({
        category,
        totalAmount: Number.parseFloat(total.toFixed(2)),
        merchants: Array.from(merchants).sort((a, b) => a.localeCompare(b)),
      });
    }

    monthCategories.sort((a, b) => a.category.localeCompare(b.category));
    report[month] = monthCategories;
  }

  return report;
};

const calculateMedian = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const middleIndex = Math.floor(sorted.length / 2);

  if (sorted.length === 0) {
    throw new Error("Cannot compute median for an empty dataset");
  }

  if (sorted.length % 2 === 0) {
    const lower = sorted[middleIndex - 1];
    const upper = sorted[middleIndex];
    if (lower === undefined || upper === undefined) {
      throw new Error("Cannot compute median for an empty dataset");
    }

    return (lower + upper) / 2;
  }

  const median = sorted[middleIndex];
  if (median === undefined) {
    throw new Error("Cannot compute median for an empty dataset");
  }

  return median;
};

const buildMonthlyCategoryStats = (
  records: ExpenseRecord[],
): MonthlyCategoryStatsReport => {
  const categoryMonthTotals = new Map<string, Map<string, number>>();

  for (const record of records) {
    const monthKey = getMonthKey(record.timestamp);
    const categoryKey = record.category ?? "Uncategorized";
    const monthTotals = categoryMonthTotals.get(categoryKey) ?? new Map();
    const updatedTotal = (monthTotals.get(monthKey) ?? 0) + record.amount;
    monthTotals.set(monthKey, updatedTotal);
    categoryMonthTotals.set(categoryKey, monthTotals);
  }

  const report: CategoryMonthlyStats[] = [];
  const sortedCategories = [...categoryMonthTotals.entries()].sort(
    ([categoryA], [categoryB]) => categoryA.localeCompare(categoryB),
  );

  for (const [category, monthTotals] of sortedCategories) {
    const sortedMonths = [...monthTotals.entries()].sort(([monthA], [monthB]) =>
      monthA.localeCompare(monthB),
    );
    const totalsArray = sortedMonths.map(([, total]) => total);
    if (totalsArray.length === 0) {
      continue;
    }
    const sum = totalsArray.reduce((acc, value) => acc + value, 0);
    const mean = sum / totalsArray.length;
    const median = calculateMedian(totalsArray);
    const monthTotalsRecord: Record<string, number> = {};
    for (const [month, total] of sortedMonths) {
      monthTotalsRecord[month] = Number.parseFloat(total.toFixed(2));
    }

    report.push({
      category,
      monthlyAverageAmount: Number.parseFloat(mean.toFixed(2)),
      monthlyMedianAmount: Number.parseFloat(median.toFixed(2)),
      monthlyTotals: monthTotalsRecord,
    });
  }

  return report;
};

const parseExpensesFile = async (
  filePath: string,
): Promise<ExpenseRecord[]> => {
  const records: ExpenseRecord[] = [];
  const parser = parse<ExpenseCsvRow>({
    columns: (headers) => headers.map(normalizeHeader),
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

program
  .command("report-expenses")
  .description("Generate a monthly category report from an expenses CSV file")
  .argument("<file>", "path to the expenses CSV file")
  .action(async (file: string) => {
    try {
      const records = await parseExpensesFile(file);
      const report = buildMonthlyReport(records);
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      program.error(message);
    }
  });

program
  .command("report-category-stats")
  .description(
    "Generate per-category monthly average and median totals from an expenses CSV file",
  )
  .argument("<file>", "path to the expenses CSV file")
  .action(async (file: string) => {
    try {
      const records = await parseExpensesFile(file);
      const stats = buildMonthlyCategoryStats(records);
      process.stdout.write(`${JSON.stringify(stats, null, 2)}\n`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      program.error(message);
    }
  });

void program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  program.error(message);
});
