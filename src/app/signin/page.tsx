'use client';

import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
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

const SignInFormSchema = z.object({
  email: z.email('Invalid email address').nonempty('Email is required'),
  password: z
    .string('Password is required')
    .min(8, 'Password should be at least 8 characters')
    .max(64, 'Password should be at most 64 characters'),
});

export default function LoginPage() {
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
      mutation UserSignIn($input: UserSignInInput!) {
        userSignIn(input: $input) {
          token

          user {
            id
          }
        }
      }
    `,
  );

  const form = useForm({
    resolver: zodResolver(SignInFormSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: z.infer<typeof SignInFormSchema>) {
    await signInMutation({
      variables: {
        input: {
          email: data.email,
          password: data.password,
        },
      },
    });
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
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup>
                  <Controller
                    name="email"
                    control={form.control}
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
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <div className="flex items-center">
                          <FieldLabel htmlFor="password">Password</FieldLabel>
                          <Link
                            href="/password-reset"
                            className="ml-auto text-sm underline-offset-4 hover:underline"
                          >
                            Forgot your password?
                          </Link>
                        </div>
                        <Input
                          {...field}
                          id="password"
                          aria-invalid={fieldState.invalid}
                          type="password"
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
