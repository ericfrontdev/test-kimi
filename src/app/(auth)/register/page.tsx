import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RegisterPageProps {
  searchParams: Promise<{ invite?: string; superadmin?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { invite, superadmin } = await searchParams;

  if (!invite && !superadmin) {
    redirect("/login");
  }

  const loginHref = superadmin
    ? `/login?superadmin=${superadmin}`
    : `/login?invite=${invite}`;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
          <CardDescription>
            Vous avez été invité à rejoindre Projet 360
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <RegisterForm />
          </Suspense>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Déjà un compte ? </span>
            <Link href={loginHref} className="text-primary hover:underline">
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
