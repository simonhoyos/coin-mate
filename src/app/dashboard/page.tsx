'use client';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconFolderCode,
} from '@tabler/icons-react';
import {
  addMonths,
  format,
  isAfter,
  isSameMonth,
  parse,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'COP',
});

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const monthParam = searchParams.get('month');
  const now = startOfMonth(new Date());

  const currentMonthDate = React.useMemo(() => {
    if (monthParam != null) {
      try {
        const parsedDate = parse(monthParam, 'yyyy-MM', new Date());

        if (!Number.isNaN(parsedDate.getTime())) {
          return startOfMonth(parsedDate);
        }
      } catch (_e) {
        return now;
      }
    }

    return now;
  }, [monthParam, now]);

  React.useEffect(() => {
    if (isAfter(currentMonthDate, now)) {
      const params = new URLSearchParams(searchParams.toString());

      params.delete('month');

      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [currentMonthDate, now, pathname, router, searchParams]);

  const handlePreviousMonth = () => {
    const prevMonth = subMonths(currentMonthDate, 1);

    const params = new URLSearchParams(searchParams.toString());

    params.set('month', format(prevMonth, 'yyyy-MM'));

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(currentMonthDate, 1);

    if (isAfter(nextMonth, now)) return;

    const params = new URLSearchParams(searchParams.toString());

    params.set('month', format(nextMonth, 'yyyy-MM'));

    router.push(`${pathname}?${params.toString()}`);
  };

  const isNextDisabled = isSameMonth(currentMonthDate, now);

  const categoryListQuery = useQuery<{
    categoryList?: {
      edges?: {
        id: string;

        name?: string;

        report?: {
          categoryId: string;

          totalCount?: number;
          totalAmountCents?: number;
          averageAmountCents?: number;
        };
      }[];
    };
  }>(
    gql`
      query CategoryListQueryFromDashboardPage($month: Int, $year: Int) {
        categoryList {
          edges {
            id

            name

            report(month: $month, year: $year) {
              categoryId

              totalCount
              totalAmountCents
              averageAmountCents
            }
          }
        }
      }
    `,
    {
      variables: {
        month: currentMonthDate.getMonth(),
        year: currentMonthDate.getFullYear(),
      },
    },
  );

  const categoryListData = categoryListQuery.data?.categoryList?.edges ?? [];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <div className="flex items-center justify-center gap-4 py-2">
          <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
            <IconChevronLeft />
          </Button>
          <span className="text-lg font-semibold min-w-32 text-center">
            {format(currentMonthDate, 'MMMM yyyy')}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            disabled={isNextDisabled}
          >
            <IconChevronRight />
          </Button>
        </div>
      </div>

      {categoryListQuery.loading === true ? (
        <div className="flex flex-1 justify-center">
          <Spinner className="size-12 text-primary mt-10" />
        </div>
      ) : categoryListData.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconFolderCode />
            </EmptyMedia>
            <EmptyTitle>No categories yet</EmptyTitle>
            <EmptyDescription>
              You haven&apos;t created any categories yet. Get started by
              creating your first category.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <section className="flex flex-1 flex-col gap-4">
          {categoryListData.map((category) => (
            <div
              key={category.id}
              className="px-4 py-6 border rounded shadow-xs flex items-center justify-between"
            >
              <div className="flex flex-col gap-2">
                <h2 className="font-bold capitalize">{category.name}</h2>
                <p className="flex gap-2">
                  <span className="font-bold">Total Transactions:</span>{' '}
                  {category.report?.totalCount ?? 0}
                </p>
                <p className="flex gap-2">
                  <span className="font-bold">Total expended:</span>
                  {moneyFormatter.format(
                    (category.report?.totalAmountCents ?? 0) / 100,
                  )}
                </p>
                <p className="flex gap-2">
                  <span className="font-bold">Average Transaction:</span>
                  {moneyFormatter.format(
                    parseFloat(
                      (
                        (category.report?.averageAmountCents ?? 0) / 100
                      ).toFixed(2),
                    ),
                  )}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
