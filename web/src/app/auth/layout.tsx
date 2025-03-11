import type React from "react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - Dexter AI",
  description: "Sign in to your Dexter AI account"
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
