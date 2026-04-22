import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isSignInPage = createRouteMatcher(["/signin"]);
const isOnboarding = createRouteMatcher(["/onboarding"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthenticated = await convexAuth.isAuthenticated();

  // Redirect authenticated users away from sign in
  if (isSignInPage(request) && isAuthenticated) {
    return nextjsMiddlewareRedirect(request, "/dashboard");
  }

  // Redirect unauthenticated users to sign in
  // But allow onboarding through for authenticated users
  if (!isSignInPage(request) && !isOnboarding(request) && !isAuthenticated) {
    return nextjsMiddlewareRedirect(request, "/signin");
  }

  // Allow unauthenticated users who somehow hit onboarding to sign in
  if (isOnboarding(request) && !isAuthenticated) {
    return nextjsMiddlewareRedirect(request, "/signin");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};