"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginToEmail } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await getSupabase().auth.signInWithPassword({
        email: loginToEmail(login),
        password,
      });

      if (error) {
        setError(
          error.message === "Invalid login credentials"
            ? "Nieprawidłowy login lub hasło."
            : error.message
        );
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error && err.message === "SUPABASE_NOT_CONFIGURED"
          ? "Brak konfiguracji Supabase. Uzupełnij plik .env.local."
          : "Nie udało się zalogować. Spróbuj ponownie."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-(--card-spacing)">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Budżet</CardTitle>
            <CardDescription>Zaloguj się, aby kontynuować</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="login">Login</Label>
              <Input
                id="login"
                name="login"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </CardContent>

          <CardFooter className="border-t-0 bg-transparent pb-(--card-spacing)">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logowanie…" : "Zaloguj się"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
