import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { query } from "./_generated/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password()],
  callbacks: {
    async createOrUpdateUser(ctx, { existingUserId, profile }) {
      if (existingUserId) {
        return existingUserId;
      }
      return ctx.db.insert("users", {
        email: profile.email ?? undefined,
        name: profile.name ?? profile.email ?? "New User",
        imageUrl: profile.image ?? undefined,
      });
    },
  },
});

export const isAuthenticated = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return userId !== null;
  },
});