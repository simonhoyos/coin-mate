'use client';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { IconFolderCode } from '@tabler/icons-react';
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
      query CategoryListQueryFromDashboardPage {
        categoryList {
          edges {
            id

            name

            report {
              categoryId

              totalCount
              totalAmountCents
              averageAmountCents
            }
          }
        }
      }
    `,
  );

  const categoryListData = categoryListQuery.data?.categoryList?.edges ?? [];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
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
                    (category.report?.averageAmountCents ?? 0) / 100,
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
