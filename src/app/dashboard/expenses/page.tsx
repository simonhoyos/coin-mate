'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  IconCirclePlus,
  IconFolderCode,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { groupBy } from 'lodash';
import { ChevronDownIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const CurrencyEnum = z.enum(['COP', 'USD'], 'Currency must be COP or USD');
const TypeEnum = z.enum(['expense', 'income'], 'Select a valid type');

const TransactionLedgerFormSchema = z.object({
  concept: z
    .string()
    .min(1, 'Concept is required')
    .max(64, 'Maximum 64 characters'),
  description: z.string().max(256, 'Maximum 256 characters').optional(),
  currency: CurrencyEnum,
  amount: z
    .string()
    .min(1, 'Amount is required')
    .regex(/^(-?\d+)\.?/, 'Only numbers and . allowed')
    .refine((value) => value.split('.').length <= 2, 'Invalid amount format')
    .refine(
      (value) => (value.match(/\./g) || []).length <= 1,
      'Maximum two decimal places allowed',
    ),
  transacted_at: z.string().min(1, 'Date is required'),
  type: TypeEnum,
  category_id: z.uuid('Select a valid category'),
});

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'COP',
});

const CREATE_EXPENSE_QUERY_PARAM = 'create_expense';
const EDIT_EXPENSE_QUERY_PARAM = 'edit_expense';

export default function ExpensesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const createExpenseModalOpen =
    searchParams.get(CREATE_EXPENSE_QUERY_PARAM) === 'true';

  const editingExpenseId = searchParams.get(EDIT_EXPENSE_QUERY_PARAM);

  const [dateOpen, setDateOpen] = React.useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = React.useState<
    string | null
  >(null);

  const createQueryString = React.useCallback(
    (args: { appendKeys?: { [key: string]: string }; omitKeys?: string[] }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (args.appendKeys != null) {
        for (const [name, value] of Object.entries(args.appendKeys)) {
          params.set(name, value);
        }
      }

      if (args.omitKeys != null) {
        for (const name of args.omitKeys) {
          params.delete(name);
        }
      }

      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams],
  );

  const expenseListQuery = useQuery<{
    expenseList?: {
      edges?: {
        id: string;

        concept?: string;
        description?: string;
        currency?: z.infer<typeof CurrencyEnum>;
        amount_cents?: number;
        transacted_at?: string;
        type?: z.infer<typeof TypeEnum>;

        category?: {
          id: string;

          name?: string;
        };
      }[];
    };
  }>(
    gql`
      query ExpenseListQuery {
        expenseList {
          edges {
            id

            concept
            description
            currency
            amount_cents
            transacted_at
            type

            category {
              id

              name
            }
          }
        }
      }
    `,
  );

  const expenseListData = expenseListQuery.data?.expenseList?.edges ?? [];

  const expenseListGroupedByDate = React.useMemo(() => {
    return groupBy(expenseListData, 'transacted_at');
  }, [expenseListData]);

  const expenseEditing = React.useMemo(() => {
    return expenseListData.find((expense) => expense.id === editingExpenseId);
  }, [editingExpenseId, expenseListData]);

  const categoryListQuery = useQuery<{
    categoryList?: {
      edges?: {
        id: string;

        name?: string;
      }[];
    };
  }>(
    gql`
      query CategoryListQueryFromExpenses {
        categoryList {
          edges {
            id

            name
          }
        }
      }
    `,
  );

  const categoryListData = categoryListQuery.data?.categoryList?.edges ?? [];

  const [transactionLedgerCreateMutation, transactionLedgerCreateState] =
    useMutation<
      {
        transactionLedgerCreate?: {
          id: string;
        };
      },
      {
        input: {
          concept: string;
          description: string | undefined;
          currency: string;
          amount: string;
          transacted_at: string;
          type: string;
          category_id: string;
        };
      }
    >(
      gql`
        mutation ExpenseCreateMutation($input: TransactionLedgerCreateInput!) {
          transactionLedgerCreate(input: $input) {
            id
          }
        }
      `,
    );

  const [transactionLedgerUpdateMutation, transactionLedgerUpdateState] =
    useMutation<
      {
        transactionLedgerUpdate?: {
          id: string;
        };
      },
      {
        input: {
          id: string;
          concept: string;
          description: string | undefined;
          currency: string;
          amount: string;
          transacted_at: string;
          type: string;
          category_id: string;
        };
      }
    >(
      gql`
        mutation ExpenseUpdateMutation($input: TransactionLedgerUpdateInput!) {
          transactionLedgerUpdate(input: $input) {
            id
          }
        }
      `,
    );

  const [transactionLedgerDeleteMutation, transactionLedgerDeleteState] =
    useMutation<
      {
        transactionLedgerUpdate?: {
          id: string;
        };
      },
      {
        input: {
          id: string;
        };
      }
    >(
      gql`
        mutation ExpenseDeleteMutation($input: TransactionLedgerDeleteInput!) {
          transactionLedgerDelete(input: $input) {
            id
          }
        }
      `,
    );

  const transactionLedgerDefaultValues = React.useMemo(
    () => ({
      concept: '',
      description: '',
      currency: CurrencyEnum.enum.COP,
      amount: '',
      transacted_at: new Date().toISOString(),
      type: TypeEnum.enum.expense,
      category_id: '',
    }),
    [],
  );

  const transactionLedgerValues = React.useMemo(
    () => ({
      concept: expenseEditing?.concept ?? '',
      description: expenseEditing?.description ?? '',
      currency: expenseEditing?.currency ?? CurrencyEnum.enum.COP,
      amount: ((expenseEditing?.amount_cents ?? 0) / 100).toFixed(2),
      transacted_at: (expenseEditing?.transacted_at != null
        ? new Date(expenseEditing.transacted_at)
        : new Date()
      ).toISOString(),
      type: expenseEditing?.type ?? TypeEnum.enum.expense,
      category_id: expenseEditing?.category?.id ?? '',
    }),
    [expenseEditing],
  );

  const transactionLedgerForm = useForm({
    resolver: zodResolver(TransactionLedgerFormSchema),
    defaultValues: transactionLedgerDefaultValues,
    values: transactionLedgerValues,
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  async function transactionLedgerCreateSubmit(
    data: z.infer<typeof TransactionLedgerFormSchema>,
  ) {
    await transactionLedgerCreateMutation({
      variables: {
        input: {
          concept: data.concept,
          description: data.description,
          currency: data.currency,
          amount: data.amount,
          transacted_at: format(data.transacted_at, 'yyyy-MM-dd'),
          type: data.type,
          category_id: data.category_id,
        },
      },
    });

    await expenseListQuery.refetch();

    transactionLedgerForm.reset();
    router.push(
      createQueryString({
        omitKeys: [CREATE_EXPENSE_QUERY_PARAM, EDIT_EXPENSE_QUERY_PARAM],
      }),
    );
  }

  const transactionLedgerUpdateSubmit = React.useCallback(
    async (data: z.infer<typeof TransactionLedgerFormSchema>) => {
      if (editingExpenseId == null) return;

      await transactionLedgerUpdateMutation({
        variables: {
          input: {
            id: editingExpenseId,
            concept: data.concept,
            description: data.description,
            currency: data.currency,
            amount: data.amount,
            transacted_at: data.transacted_at,
            type: data.type,
            category_id: data.category_id,
          },
        },
      });

      await expenseListQuery.refetch();

      transactionLedgerForm.reset();
      router.push(
        createQueryString({
          omitKeys: [CREATE_EXPENSE_QUERY_PARAM, EDIT_EXPENSE_QUERY_PARAM],
        }),
      );
    },
    [
      editingExpenseId,
      transactionLedgerForm.reset,
      transactionLedgerUpdateMutation,
      expenseListQuery,
      router,
      createQueryString,
    ],
  );

  async function transactionLedgerDeleteConfirm() {
    if (deletingTransactionId == null) return;

    await transactionLedgerDeleteMutation({
      variables: {
        input: {
          id: deletingTransactionId,
        },
      },
    });

    await expenseListQuery.refetch();

    setDeletingTransactionId(null);
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1>Expenses</h1>
          <Button type="button" variant="outline" asChild>
            <Link
              href={createQueryString({
                appendKeys: {
                  [CREATE_EXPENSE_QUERY_PARAM]: 'true',
                },
                omitKeys: [EDIT_EXPENSE_QUERY_PARAM],
              })}
            >
              <IconCirclePlus />
              <span>Create transactions</span>
            </Link>
          </Button>
        </div>

        {expenseListQuery.loading === true ? (
          <div className="flex flex-1 justify-center">
            <Spinner className="size-12 text-primary mt-10" />
          </div>
        ) : expenseListData.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconFolderCode />
              </EmptyMedia>
              <EmptyTitle>No transactions yet</EmptyTitle>
              <EmptyDescription>
                You haven&apos;t created any transactions yet. Get started by
                creating your first transaction.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className="flex gap-2">
                <Button type="button" asChild>
                  <Link
                    href={createQueryString({
                      appendKeys: {
                        [CREATE_EXPENSE_QUERY_PARAM]: 'true',
                      },
                      omitKeys: [EDIT_EXPENSE_QUERY_PARAM],
                    })}
                  >
                    <IconCirclePlus />
                    <span>Create transactions</span>
                  </Link>
                </Button>
              </div>
            </EmptyContent>
          </Empty>
        ) : (
          <section className="flex flex-1 flex-col gap-4">
            {Object.entries(expenseListGroupedByDate).map(
              ([groupDate, expenseList]) => (
                <section key={groupDate} className="flex flex-col gap-4">
                  <h2 className="font-semibold text-lg">{groupDate}</h2>

                  {expenseList.map((expense) => (
                    <div
                      key={expense.id}
                      className="px-4 py-6 border rounded shadow-xs flex flex-col gap-2"
                    >
                      {
                        <p className="text-xs text-gray-800">
                          {expense.category?.name} ({expense.type})
                        </p>
                      }
                      <div className="flex justify-between w-full">
                        <div className="flex flex-col gap-2">
                          <h2 className="font-bold">{expense.concept}</h2>
                          {(expense.description ?? '') !== '' && (
                            <p>{expense.description}</p>
                          )}
                        </div>
                        <div>
                          <p>
                            {moneyFormatter.format(
                              (expense.amount_cents ?? 0) / 100,
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="ghost" asChild>
                            <Link
                              href={createQueryString({
                                appendKeys: {
                                  [EDIT_EXPENSE_QUERY_PARAM]: expense.id,
                                },
                                omitKeys: [CREATE_EXPENSE_QUERY_PARAM],
                              })}
                            >
                              <IconPencil />
                              <span className="sr-only">Edit transaction</span>
                            </Link>
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setDeletingTransactionId(expense.id)}
                          >
                            <IconTrash className="text-destructive" />
                            <span className="sr-only">Delete transaction</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </section>
              ),
            )}
          </section>
        )}
      </div>

      <Dialog
        open={createExpenseModalOpen || expenseEditing != null}
        onOpenChange={(open) => {
          if (open === false) {
            router.push(
              createQueryString({
                omitKeys: [
                  CREATE_EXPENSE_QUERY_PARAM,
                  EDIT_EXPENSE_QUERY_PARAM,
                ],
              }),
            );
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {expenseEditing != null
                ? 'Edit transaction'
                : 'Create a new transaction'}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={transactionLedgerForm.handleSubmit(
              expenseEditing != null
                ? transactionLedgerUpdateSubmit
                : transactionLedgerCreateSubmit,
            )}
            className="flex flex-col gap-2"
          >
            <FieldGroup>
              <Controller
                name="concept"
                control={transactionLedgerForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="concept">Concept</FieldLabel>
                    <Input
                      {...field}
                      id="concept"
                      aria-invalid={fieldState.invalid}
                      type="text"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="description"
                control={transactionLedgerForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="description">Description</FieldLabel>
                    <Input
                      {...field}
                      id="description"
                      aria-invalid={fieldState.invalid}
                      type="text"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <div className="flex gap-2">
                <Controller
                  name="currency"
                  control={transactionLedgerForm.control}
                  render={({ field, fieldState }) => (
                    <Field className="shrink">
                      <FieldLabel htmlFor="currency">Currency</FieldLabel>
                      <Select
                        {...field}
                        aria-invalid={fieldState.invalid}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="currency">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {CurrencyEnum.options.map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="amount"
                  control={transactionLedgerForm.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor="currency">Amount</FieldLabel>
                      <Input
                        {...field}
                        id="amount"
                        aria-invalid={fieldState.invalid}
                        type="text"
                        onChange={(e) => {
                          const value = e.target.value ?? '';

                          if (/^\d*\.?(\d{0,2})?$/.test(value)) {
                            field.onChange(value);
                          }
                        }}
                        onBlur={(e) => {
                          let result = e.target.value ?? '0';

                          if (
                            result === '' ||
                            /^\d+\.?(\d{0,2})?$/.test(result) !== true
                          ) {
                            field.onChange(result);
                            transactionLedgerForm.trigger('amount');
                            return;
                          }

                          result = result.replace(/^0+/, '');

                          if (result.startsWith('.')) {
                            result = `0${result}`;
                          }

                          const dotCount = (result.match(/\./g) || []).length;

                          if (dotCount <= 0) {
                            result += '.';
                          }

                          const decimalPlaces =
                            result.split('.').at(1)?.length ?? 0;
                          const missingDecimalPlaces = 2 - decimalPlaces;

                          if (
                            missingDecimalPlaces > 0 &&
                            missingDecimalPlaces <= 2
                          ) {
                            result = result + '0'.repeat(missingDecimalPlaces);
                          }

                          result = result.slice(0, result.indexOf('.') + 3);

                          field.onChange(result);
                          transactionLedgerForm.trigger('amount');
                        }}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
              <Controller
                name="transacted_at"
                control={transactionLedgerForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="transacted_at">Date</FieldLabel>
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          id="date"
                          className="w-48 justify-between font-normal"
                        >
                          {field.value
                            ? new Date(field.value).toLocaleDateString()
                            : 'Select date'}
                          <ChevronDownIcon />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={new Date(field.value)}
                          captionLayout="dropdown"
                          onSelect={(date) => {
                            field.onChange(date?.toISOString());
                            setDateOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <div className="flex gap-2">
                <Controller
                  name="type"
                  control={transactionLedgerForm.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor="type">Type</FieldLabel>
                      <Select
                        {...field}
                        aria-invalid={fieldState.invalid}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {TypeEnum.options.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="category_id"
                  control={transactionLedgerForm.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor="category_id">Category</FieldLabel>
                      <Select
                        {...field}
                        aria-invalid={fieldState.invalid}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="category_id">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryListData.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id}
                              className="capitalize"
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
              <Field>
                <div className="flex flex-1 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'flex-1',
                      transactionLedgerCreateState.loading === true ||
                        (transactionLedgerUpdateState.loading === true &&
                          'opacity-50 pointer-events-none'),
                    )}
                    asChild
                  >
                    <Link
                      href={createQueryString({
                        omitKeys: [CREATE_EXPENSE_QUERY_PARAM],
                      })}
                    >
                      Cancel
                    </Link>
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={
                      transactionLedgerCreateState.loading === true ||
                      transactionLedgerUpdateState.loading === true
                    }
                  >
                    {expenseEditing != null
                      ? 'Update transaction'
                      : 'Create transaction'}
                  </Button>
                </div>
              </Field>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deletingTransactionId != null}
        onOpenChange={(open) => {
          if (open === false) {
            setDeletingTransactionId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete an existing transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction?
              <br />
              This action cannot be undone
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setDeletingTransactionId(null)}
              disabled={transactionLedgerDeleteState.loading === true}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={transactionLedgerDeleteConfirm}
              disabled={transactionLedgerDeleteState.loading === true}
            >
              Delete transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
