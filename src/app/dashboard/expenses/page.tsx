'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconCirclePlus } from '@tabler/icons-react';
import { groupBy } from 'lodash';
import { ChevronDownIcon } from 'lucide-react';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

const CurrencyEnum = z.enum(['COP', 'USD'], 'Currency must be COP or USD');
const TypeEnum = z.enum(['expense', 'income'], 'Select a valid type');

const TransactionLedgerCreateFormSchema = z.object({
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

export default function ExpensesPage() {
  const [open, setOpen] = React.useState(false);
  const [dateOpen, setDateOpen] = React.useState(false);

  const expenseListQuery = useQuery<{
    expenseList?: {
      edges?: {
        id: string;

        concept?: string;
        description?: string;
        currency?: string;
        amount_cents?: number;
        transacted_at?: string;
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
          }
        }
      }
    `,
  );

  const expenseListData = expenseListQuery.data?.expenseList?.edges ?? [];

  const expenseListGroupedByDate = React.useMemo(() => {
    return groupBy(expenseListData, 'transacted_at');
  }, [expenseListData]);

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

  const transactionLedgerCreateDefaultValues = React.useMemo(
    () => ({
      concept: '',
      description: '',
      currency: 'COP' as const,
      amount: '',
      transacted_at: new Date().toISOString(),
      type: 'expense' as const,
      category_id: '',
    }),
    [],
  );

  const transactionLedgerCreateForm = useForm({
    resolver: zodResolver(TransactionLedgerCreateFormSchema),
    defaultValues: transactionLedgerCreateDefaultValues,
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  async function transactionLedgerCreateSubmit(
    data: z.infer<typeof TransactionLedgerCreateFormSchema>,
  ) {
    await transactionLedgerCreateMutation({
      variables: {
        input: {
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

    setOpen(false);
    transactionLedgerCreateForm.reset();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1>Expenses</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline">
              <IconCirclePlus />
              <span>Create transactions</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new transaction</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={transactionLedgerCreateForm.handleSubmit(
                transactionLedgerCreateSubmit,
              )}
              className="flex flex-col gap-2"
            >
              <FieldGroup>
                <Controller
                  name="concept"
                  control={transactionLedgerCreateForm.control}
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
                  control={transactionLedgerCreateForm.control}
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
                    control={transactionLedgerCreateForm.control}
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
                    control={transactionLedgerCreateForm.control}
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
                              transactionLedgerCreateForm.trigger('amount');
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
                              result =
                                result + '0'.repeat(missingDecimalPlaces);
                            }

                            result = result.slice(0, result.indexOf('.') + 3);

                            field.onChange(result);
                            transactionLedgerCreateForm.trigger('amount');
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
                  control={transactionLedgerCreateForm.control}
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
                              field.onChange(date?.toLocaleString());
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
                    control={transactionLedgerCreateForm.control}
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
                    control={transactionLedgerCreateForm.control}
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
                              <SelectItem key={category.id} value={category.id}>
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
                      className="flex-1"
                      disabled={transactionLedgerCreateState.loading === true}
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={transactionLedgerCreateState.loading === true}
                    >
                      Create transaction
                    </Button>
                  </div>
                </Field>
              </FieldGroup>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <section className="flex flex-1 flex-col gap-4">
        {Object.entries(expenseListGroupedByDate).map(
          ([groupDate, expenseList]) => (
            <section key={groupDate} className="flex flex-col gap-4">
              <h2 className="font-semibold text-lg">{groupDate}</h2>

              {expenseList.map((expense) => (
                <div
                  key={expense.id}
                  className="px-4 py-6 border rounded shadow-xs flex items-center justify-between"
                >
                  <div className="flex justify-between w-full">
                    <div className="flex flex-col gap-2">
                      <h2 className="font-bold">{expense.concept}</h2>
                      {(expense.description ?? '') !== '' && (
                        <p>{expense.description}</p>
                      )}
                    </div>
                    <div>
                      <p>
                        {expense.currency}$ {(expense.amount_cents ?? 0) / 100}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          ),
        )}
      </section>
    </div>
  );
}
