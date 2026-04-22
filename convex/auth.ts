import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";
import { Resend } from "resend";
import { query } from "./_generated/server";

const resend = new Resend(process.env.AUTH_RESEND_KEY);

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password(),
    Email({
      id: "resend-otp",
      apiKey: process.env.AUTH_RESEND_KEY,
      maxAge: 60 * 15, // 15 minutes
      async generateVerificationToken() {
        return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
      },
      async sendVerificationRequest({ identifier: email, url, token }) {
        // console.log(`OTP for ${email}: ${token}`);
        await resend.emails.send({
          from: process.env.AUTH_RESEND_OTP_EMAIL ?? "onboarding@resend.dev",
          to: email,
          subject: "Your Ordo sign in code",
          text: `Your Ordo verification code is: ${token}`,
        });
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, { existingUserId, profile }) {
      if (existingUserId) {
        await ctx.db.patch(existingUserId, {
          email: profile.email ?? undefined,
          name: profile.name ?? undefined,
          imageUrl: profile.image ?? undefined,
        });
        return existingUserId;
      }
      return await ctx.db.insert("users", {
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