export class TransactionLedger {
  id!: string;

  created_at!: Date | string
  updated_at!: Date | string

  concept!: string;
  description?: string | undefined;
  currency!: string;
  amount_cents!: number;
  transacted_at!: Date | string;

  user_id!: string;
  category_id!: string;

  archived_at?: Date | string | null;
}
