'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconCheck, IconEye, IconEyeOff } from '@tabler/icons-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
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
import { cn } from '@/lib/utils';

const SignUpFormSchema = z
  .object({
    email: z.email('Invalid email address').nonempty('Email is required'),
    password: z
      .string('Invalid password')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#\-_+=.^])[A-Za-z\d@$!%*?&#\-_+=.^]{8,64}$/,
        'One or more password requirements not met',
      ),
    confirmPassword: z
      .string('Invalid confirm password')
      .min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function SignUpPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const meQuery = useQuery<{
    me?: {
      id: string;
    };
  }>(
    gql`
      query MeQueryFromSignUp {
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

  const defaultValues = React.useMemo(
    () => ({
      email: '',
      password: '',
      confirmPassword: '',
    }),
    [],
  );

  const form = useForm({
    resolver: zodResolver(SignUpFormSchema),
    mode: 'onBlur',
    defaultValues,
  });

  async function onSubmit(data: z.infer<typeof SignUpFormSchema>) {
    const { data: userSignUpData } = await signUpMutation({
      variables: {
        input: {
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
        },
      },
    });

    if (userSignUpData?.userSignUp.token != null) {
      redirect('/dashboard/expenses');
    }
  }

  const passwordValue = useWatch({
    control: form.control,
    name: 'password',
  });

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
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          aria-invalid={fieldState.invalid}
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
                      <Field data-invalid={fieldState.invalid}>
                        <div className="flex items-center">
                          <FieldLabel htmlFor="password">Password</FieldLabel>
                        </div>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            id="password"
                            type={showPassword === true ? 'text' : 'password'}
                            aria-invalid={fieldState.invalid}
                            onChange={(e) => {
                              const value = e.target.value;

                              field.onChange(value);

                              if (form.getValues('confirmPassword') !== '') {
                                form.trigger('confirmPassword');
                              }
                            }}
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
                  <Controller
                    name="confirmPassword"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <div className="flex items-center">
                          <FieldLabel htmlFor="confirmPassword">
                            Confirm password
                          </FieldLabel>
                        </div>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            id="confirmPassword"
                            type={
                              showConfirmPassword === true ? 'text' : 'password'
                            }
                            aria-invalid={fieldState.invalid}
                            required
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
                              variant="ghost"
                              size="icon-xs"
                              className="cursor-pointer"
                              onClick={() =>
                                setShowConfirmPassword((prev) => !prev)
                              }
                            >
                              {showConfirmPassword === true ? (
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
                        <div>
                          <div
                            className={cn(
                              'flex flex-row items-center gap-2 text-xs text-gray-600',
                              passwordValue.length >= 8 &&
                                passwordValue.length <= 64
                                ? 'text-green-600'
                                : undefined,
                            )}
                          >
                            <IconCheck className="w-4" />
                            <p>Between 8 and 64 characters</p>
                          </div>
                          <div
                            className={cn(
                              'flex flex-row items-center gap-2 text-xs text-gray-600',
                              /[A-Z]/.test(passwordValue)
                                ? 'text-green-600'
                                : undefined,
                            )}
                          >
                            <IconCheck className="w-4" />
                            <p>Must contain at least one uppercase letter</p>
                          </div>
                          <div
                            className={cn(
                              'flex flex-row items-center gap-2 text-xs text-gray-600',
                              /[a-z]/.test(passwordValue)
                                ? 'text-green-600'
                                : undefined,
                            )}
                          >
                            <IconCheck className="w-4" />
                            <p>Must contain at least one lowercase letter</p>
                          </div>
                          <div
                            className={cn(
                              'flex flex-row items-center gap-2 text-xs text-gray-600',
                              /[0-9]/.test(passwordValue)
                                ? 'text-green-600'
                                : undefined,
                            )}
                          >
                            <IconCheck className="w-4" />
                            <p>Must contain at least one number</p>
                          </div>
                          <div
                            className={cn(
                              'flex flex-row items-center gap-2 text-xs text-gray-600',
                              /[@$!%*?&#\-_+=.^]/.test(passwordValue)
                                ? 'text-green-600'
                                : undefined,
                            )}
                          >
                            <IconCheck className="w-4" />
                            <p>
                              Must contain at least one special character
                              (@$!%*?&amp;#-_+=.^)
                            </p>
                          </div>
                        </div>
                      </Field>
                    )}
                  />
                  <Field>
                    <Button type="submit" disabled={signUpState.loading === true}>
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
