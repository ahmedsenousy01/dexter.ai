import { NextResponse } from "next/server";

import { auth } from "@/server/auth";
import { DEFAULT_REDIRECT_ROUTE, authRoutes, publicRoutes } from "@/server/auth/routes";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_REDIRECT_ROUTE, req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${pathname ?? DEFAULT_REDIRECT_ROUTE}`, req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next|api|logo.svg|favicon.ico).*)", "/"]
};
