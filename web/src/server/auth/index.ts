import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth, { type DefaultSession } from "next-auth";
import { type Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import { useSession } from "next-auth/react";

import { env } from "@/env";
import { db } from "@/server/db";
import { accounts, users } from "@/server/db/schema/tables";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   role: UserRole;
  // }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub
      }
    })
  },
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts
  }) as Adapter,
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/signin"
  },
  debug: env.NODE_ENV === "development"
});

export const getCurrentUser = async () => {
  const session = await auth();
  return session?.user;
};

export function useCurrentUser() {
  const { data: session } = useSession();
  return session?.user;
}
