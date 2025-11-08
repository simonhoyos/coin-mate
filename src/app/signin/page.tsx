'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react';
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Logo } from '@/components/ui/logo';

const SignInFormSchema = z.object({
  email: z.email('Invalid email address').nonempty('Email is required'),
  password: z.string('Invalid password').min(1, 'Password is required'),
});

export default function SignInPage() {
  const [showPassword, setShowPassword] = React.useState(false);

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

  const [signInMutation, signInState] = useMutation<
    {
      userSignIn: {
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
      };
    }
  >(
    gql`
      mutation UserSignInMutation($input: UserSignInInput!) {
        userSignIn(input: $input) {
          token

          user {
            id
          }
        }
      }
    `,
  );

  const defaultValues = React.useMemo(
    () => ({
      email: '',
      password: '',
    }),
    [],
  );

  const signInForm = useForm({
    resolver: zodResolver(SignInFormSchema),
    mode: 'onBlur',
    defaultValues,
  });

  async function onSubmit(data: z.infer<typeof SignInFormSchema>) {
    const { data: userSignInData } = await signInMutation({
      variables: {
        input: {
          email: data.email,
          password: data.password,
        },
      },
    });

    if (userSignInData?.userSignIn.token != null) {
      redirect('/dashboard/expenses');
    }
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
              <CardTitle className="text-xl">Welcome back</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={signInForm.handleSubmit(onSubmit)}>
                <FieldGroup>
                  <Controller
                    name="email"
                    control={signInForm.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input
                          {...field}
                          id="email"
                          aria-invalid={fieldState.invalid}
                          type="text"
                          placeholder="m@example.com"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="password"
                    control={signInForm.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <div className="flex items-center">
                          <FieldLabel htmlFor="password">Password</FieldLabel>
                          <Link
                            href="/password-reset"
                            className="ml-auto text-sm text-foreground underline-offset-4 hover:underline"
                          >
                            Forgot your password?
                          </Link>
                        </div>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            id="password"
                            type={showPassword === true ? 'text' : 'password'}
                            aria-invalid={fieldState.invalid}
                            required
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
                              variant="ghost"
                              size="icon-xs"
                              className="cursor-pointer"
                              onClick={() => setShowPassword((prev) => !prev)}
                            >
                              {showPassword === true ? (
                                <IconEye />
                              ) : (
                                <IconEyeOff />
                              )}
                            </InputGroupButton>
                          </InputGroupAddon>
                        </InputGroup>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Field>
                    <Button
                      type="submit"
                      disabled={signInState.loading === true}
                    >
                      Login
                    </Button>
                    <FieldDescription className="text-center">
                      Don&apos;t have an account?{' '}
                      <Link href="/signup">Sign up</Link>
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
