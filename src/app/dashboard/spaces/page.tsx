'use client';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { IconSpaces } from '@tabler/icons-react';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';

export default function SpacesPage() {
  const spaceListQuery = useQuery<{
    userSpaceList?: {
      edges?: {
        id: string;

        name?: string;
        description?: string;
      }[];
    };
  }>(
    gql`
      query SpaceListQuery {
        userSpaceList {
          edges {
            id

            name
            description
          }
        }
      }
    `,
  );

  const spaceListData = spaceListQuery.data?.userSpaceList?.edges ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1>Spaces</h1>
      </div>
      {spaceListQuery.loading === true ? (
        <div className="flex flex-1 justify-center">
          <Spinner className="size-12 text-primary mt-10" />
        </div>
      ) : spaceListData.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconSpaces />
            </EmptyMedia>
            <EmptyTitle>No spaces yet</EmptyTitle>
            <EmptyDescription>
              You are not a member of any spaces yet.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <section className="flex flex-1 flex-col gap-4">
          {spaceListData.map((space) => (
            <div
              key={space.id}
              className="px-4 py-6 border rounded shadow-xs flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold capitalize">{space.name}</h2>
              </div>
              {(space.description ?? '') !== '' && (
                <p className="text-sm">{space.description}</p>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
