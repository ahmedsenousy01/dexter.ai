import { type Metadata } from "next";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { GeistSans } from "geist/font/sans";

import AuthSessionProvider from "@/components/providers/session-provider";
import { auth } from "@/server/auth";
import "@/styles/globals.css";
import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "Dexter AI",
  description: "Dexter AI",
  icons: [{ rel: "icon", url: "/favicon.ico" }]
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${GeistSans.variable}`}
    >
      <body>
        <AuthSessionProvider session={session}>
          <TRPCReactProvider>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          </TRPCReactProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
