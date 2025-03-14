/**
 * An array of all the public routes that should be available to the user
 * without requiring authentication.
 * */
export const publicRoutes: string[] = ["/warmup", "/info/terms-of-service", "/info/privacy-policy", "/"];

/**
 * An array of routes used for authentication.
 * these routes will redirect logged in users to the home page.
 * */
export const authRoutes: string[] = ["/auth"];

export const DEFAULT_REDIRECT_ROUTE = "/";
