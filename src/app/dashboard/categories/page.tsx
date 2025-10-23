'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { DialogDescription } from '@radix-ui/react-dialog';
import { IconCirclePlus, IconPencil, IconTrash } from '@tabler/icons-react';
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
  const [open, setOpen] = React.useState(false);

  const categoryListQuery = useQuery<{
    categoryList?: {
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
      categoryCreate?: {
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

    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1>Categories</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline">
              <IconCirclePlus />
              <span>Create category</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new category</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={categoryCreateForm.handleSubmit(categoryCreateSubmit)}
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
                <Field>
                  <div className="flex flex-1 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      disabled={categoryCreateState.loading === true}
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={categoryCreateState.loading === true}
                    >
                      Create category
                    </Button>
                  </div>
                </Field>
              </FieldGroup>
            </form>
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

            <div className="flex gap-2">
              <CategoryUpdateAction
                id={category.id}
                name={category.name}
                description={category.description}
              />
              <CategoryDeleteAction id={category.id} />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function CategoryUpdateAction(props: {
  id: string;

  name: string | undefined;
  description: string | undefined;
}) {
  const [open, setOpen] = React.useState(false);

  const [categoryUpdateMutation, categoryUpdateState] = useMutation<
    {
      categoryUpdate?: {
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

    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost">
          <IconPencil />
          <span className="sr-only">Update category</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update an existing category</DialogTitle>
        </DialogHeader>
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
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Field>
              <div className="flex flex-1 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={categoryUpdateState.loading === true}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={categoryUpdateState.loading === true}
                >
                  Update category
                </Button>
              </div>
            </Field>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryDeleteAction(props: { id: string }) {
  const [open, setOpen] = React.useState(false);

  const [categoryDeleteMutation, categoryDeleteState] = useMutation<
    {
      categoryDelete?: {
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
      mutation CategoryDeleteMutation($input: CategoryDeleteInput!) {
        categoryDelete(input: $input) {
          id
        }
      }
    `,
  );

  async function categoryDeleteConfirm() {
    await categoryDeleteMutation({
      variables: {
        input: {
          id: props.id,
        },
      },
    });

    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost">
          <IconTrash className="text-destructive" />
          <span className="sr-only">Delete category</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update an existing category</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this category?
            <br />
            This action cannot be undone
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
            disabled={categoryDeleteState.loading === true}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            onClick={categoryDeleteConfirm}
            disabled={categoryDeleteState.loading === true}
          >
            Delete category
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
