'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconCirclePlusFilled } from '@tabler/icons-react';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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

const CategoryCreateFromSchema = z.object({
  name: z.string().min(1).max(32),
  description: z.string().max(256).optional(),
});

export default function CategoriesPage() {
  const categoryListQuery = useQuery<{
    categoryList: {
      edges?: {
        id: string;

        name?: string;
        description?: string;
      }[];
    };
  }>(
    gql`
      query CategoryListQuery {
        categoryList {
          edges {
            id

            name
            description
          }
        }
      }
    `
  )

  const categoryListData = categoryListQuery.data?.categoryList?.edges ?? [];

  const [categoryCreateMutation, categoryCreateState] = useMutation<
    {
      categoryCreate: {
        id: string;

        name?: string;
        description?: string;
      };
    },
    {
      input: {
        name: string;
        description: string | undefined;
      };
    }
  >(
    gql`
      mutation CategoryCreateMutation($input: CategoryCreateInput!) {
        categoryCreate(input: $input) {
          id
          name
          description
        }
      }
    `,
  );

  const defaultValues = React.useMemo(
    () => ({
      name: '',
      description: '',
    }),
    [],
  );

  const form = useForm({
    resolver: zodResolver(CategoryCreateFromSchema),
    mode: 'onBlur',
    defaultValues,
  });

  async function onSubmit(data: z.infer<typeof CategoryCreateFromSchema>) {
    await categoryCreateMutation({
      variables: {
        input: {
          name: data.name,
          description: data.description,
        },
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1>Categories</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear">
              <IconCirclePlusFilled />
              <span>Create category</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new category</DialogTitle>
              <div>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-col gap-4"
                >
                  <FieldGroup>
                    <Controller
                      name="name"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel htmlFor="name">Name</FieldLabel>
                          <Input
                            {...field}
                            id="name"
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
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel htmlFor="description">
                            Description
                          </FieldLabel>
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
                    <Field>
                      <Button
                        type="submit"
                        disabled={categoryCreateState.loading === true}
                      >
                        Create category
                      </Button>
                    </Field>
                  </FieldGroup>
                </form>
              </div>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
      <section className="flex flex-1 flex-col gap-4">
        {categoryListData.map((category) => (
          <div key={category.id} className="px-4 py-6 border rounded shadow-xs">
            <h2>{category.name}</h2>
            {category.description != null && <p>{category.description}</p>}
          </div>
        ))}
      </section>
    </div>
  );
}
