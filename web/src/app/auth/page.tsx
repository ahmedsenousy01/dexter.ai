import { AuthCard } from "@/app/auth/_components/auth-card";
import { AuthLayout } from "@/app/auth/_components/auth-layout";
import { GithubButton } from "@/app/auth/_components/github-button";
import { GoogleButton } from "@/app/auth/_components/google-button";
import { DEFAULT_REDIRECT_ROUTE } from "@/server/auth/routes";

interface PageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function AuthPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const callbackUrl = resolvedParams.callbackUrl ?? DEFAULT_REDIRECT_ROUTE;

  return (
    <AuthLayout>
      <AuthCard title="Sign in to your account">
        <GoogleButton callbackUrl={callbackUrl} />
        <GithubButton callbackUrl={callbackUrl} />
      </AuthCard>
    </AuthLayout>
  );
}
