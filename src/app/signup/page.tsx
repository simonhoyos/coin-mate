'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/logo';

const SignUpFormSchema = z
  .object({
    email: z.email('Invalid email address').nonempty('Email is required'),
    password: z
      .string('Password is required')
      .min(8, 'Password should be at least 8 characters')
      .max(64, 'Password should be at most 64 characters'),
    confirmPassword: z.string('Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
  });

export default function SignUpPage() {
  const meQuery = useQuery<{
    me?: {
      id: string;
    };
  }>(
    gql`
      query MeQueryFromSignIn {
        me {
          id
        }
      }
    `,
  );

  const meData = meQuery.data;
  const [signUpMutation, signUpState] = useMutation<
    {
      userSignUp: {
        token?: string;

        user?: {
          id: string;
        };
      };
    },
    {
      input: {
        email: string;
        password: string;
        confirmPassword: string;
      };
    }
  >(
    gql`
      mutation UserSignUp($input: UserSignUpInput!) {
        userSignUp(input: $input) {
          token

          user {
            id
          }
        }
      }
    `,
  );

  const form = useForm({
    resolver: zodResolver(SignUpFormSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: z.infer<typeof SignUpFormSchema>) {
    await signUpMutation({
      variables: {
        input: {
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
        },
      },
    });

    signUpState.data?.userSignUp.token != null &&
      redirect('/dashboard/expenses');
  }

  if (meData?.me?.id != null) {
    redirect('/dashboard/expenses');
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <Logo className="size-6" />
          CoinMate
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Welcome</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup>
                  <Controller
                    name="email"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          placeholder="m@example.com"
                          required
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="password"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <div className="flex items-center">
                          <FieldLabel htmlFor="password">Password</FieldLabel>
                        </div>
                        <Input
                          {...field}
                          id="password"
                          type="password"
                          required
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="confirmPassword"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <div className="flex items-center">
                          <FieldLabel htmlFor="confirmPassword">
                            Confirm password
                          </FieldLabel>
                        </div>
                        <Input
                          {...field}
                          id="confirmPassword"
                          type="password"
                          required
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
                      disabled={signUpState.loading === true}
                    >
                      Register
                    </Button>
                    <FieldDescription className="text-center">
                      Already have an account?{' '}
                      <Link href="/signin">Sign in</Link>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
          <FieldDescription className="px-6 text-center">
            By clicking continue, you agree to our{' '}
            <Link href="/terms">Terms of Service</Link> and{' '}
            <Link href="/privacy-policy">Privacy Policy</Link>.
          </FieldDescription>
        </div>
      </div>
    </div>
  );
}
