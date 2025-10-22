'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconCirclePlusFilled, IconPencil } from '@tabler/icons-react';
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

const CategoryCreateFormSchema = z.object({
  name: z.string().min(1).max(32),
  description: z.string().max(256).optional(),
});

const CategoryUpdateFormSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(32).optional(),
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
    `,
  );

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

  const categoryCreateDefaultValues = React.useMemo(
    () => ({
      name: '',
      description: '',
    }),
    [],
  );

  const categoryCreateForm = useForm({
    resolver: zodResolver(CategoryCreateFormSchema),
    mode: 'onBlur',
    defaultValues: categoryCreateDefaultValues,
  });

  async function categoryCreateSubmit(
    data: z.infer<typeof CategoryCreateFormSchema>,
  ) {
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
            <Button type="button">
              <IconCirclePlusFilled />
              <span>Create category</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new category</DialogTitle>
              <div>
                <form
                  onSubmit={categoryCreateForm.handleSubmit(
                    categoryCreateSubmit,
                  )}
                  className="flex flex-col gap-4"
                >
                  <FieldGroup>
                    <Controller
                      name="name"
                      control={categoryCreateForm.control}
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
                      control={categoryCreateForm.control}
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
          <div
            key={category.id}
            className="px-4 py-6 border rounded shadow-xs flex items-center justify-between"
          >
            <div className="flex flex-col gap-2">
              <h2>{category.name}</h2>
              {category.description != null && <p>{category.description}</p>}
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="ghost">
                  <IconPencil />
                  <span className="sr-only">Update category</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update an existing category</DialogTitle>
                  <div>
                    <CategoryUpdateForm
                      id={category.id}
                      name={category.name}
                      description={category.description}
                    />
                  </div>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </section>
    </div>
  );
}

function CategoryUpdateForm(props: {
  id: string;

  name: string | undefined;
  description: string | undefined;
}) {
  const [categoryUpdateMutation, categoryUpdateState] = useMutation<
    {
      categoryUpdate: {
        id: string;

        name?: string;
        description?: string;
      };
    },
    {
      input: {
        id: string;
        name: string | undefined;
        description: string | undefined;
      };
    }
  >(
    gql`
      mutation CategoryUpdateMutation($input: CategoryUpdateInput!) {
        categoryUpdate(input: $input) {
          id
          name
          description
        }
      }
    `,
  );

  const categoryUpdateDefaultValues = React.useMemo(
    () => ({
      id: props.id,
      name: props.name ?? '',
      description: props.description ?? '',
    }),
    [props.id, props.name, props.description],
  );

  const categoryUpdateForm = useForm({
    resolver: zodResolver(CategoryUpdateFormSchema),
    mode: 'onBlur',
    defaultValues: categoryUpdateDefaultValues,
  });

  async function categoryUpdateSubmit(
    data: z.infer<typeof CategoryUpdateFormSchema>,
  ) {
    await categoryUpdateMutation({
      variables: {
        input: {
          id: data.id,
          name: data.name,
          description: data.description,
        },
      },
    });
  }

  return (
    <form
      onSubmit={categoryUpdateForm.handleSubmit(categoryUpdateSubmit)}
      className="flex flex-col gap-4"
    >
      <FieldGroup>
        <Controller
          name="name"
          control={categoryUpdateForm.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                {...field}
                id="name"
                aria-invalid={fieldState.invalid}
                type="text"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="description"
          control={categoryUpdateForm.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Input
                {...field}
                id="description"
                aria-invalid={fieldState.invalid}
                type="text"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Field>
          <Button type="submit" disabled={categoryUpdateState.loading === true}>
            Update category
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
