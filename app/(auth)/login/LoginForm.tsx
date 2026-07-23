"use client";

import { useActionState } from "react";
import Link from "next/link";
import { logIn, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Card, CardBody } from "@/components/ui/Card";

const initialState: AuthActionState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(logIn, initialState);

  return (
    <Card>
      <CardBody className="pt-5 space-y-4">
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <FieldError>{state.error}</FieldError>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-accent">
            Create an account
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
