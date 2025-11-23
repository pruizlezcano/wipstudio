import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/db";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../email/mailer";
import { ResetPasswordEmail } from "../email/templates/reset-password";
import { VerifyEmail } from "../email/templates/verify-email";
import { generateAvatarBase64 } from "../avatar-generator";

const REQUIRE_EMAIL_VERIFICATION =
  process.env.REQUIRE_EMAIL_VERIFICATION === "true";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: REQUIRE_EMAIL_VERIFICATION,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        template: ResetPasswordEmail({ resetUrl: url }),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: REQUIRE_EMAIL_VERIFICATION,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        template: VerifyEmail({ verifyUrl: url }),
      });
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Set avatar on sign-up (when email verification is disabled)
      if (ctx.path.startsWith("/sign-up")) {
        const newSession = ctx.context.newSession;
        if (newSession) {
          const image = generateAvatarBase64(newSession.user.id);
          await db
            .update(schema.user)
            .set({ image })
            .where(eq(schema.user.id, newSession.user.id));
        }
      }

      // Set avatar after email verification (when email verification is enabled)
      if (ctx.path.startsWith("/verify-email")) {
        const newSession = ctx.context.newSession;
        if (newSession) {
          // Check if user already has an avatar
          const user = await db
            .select()
            .from(schema.user)
            .where(eq(schema.user.id, newSession.user.id));

          if (user.length > 0 && !user[0].image) {
            const image = generateAvatarBase64(newSession.user.id);
            await db
              .update(schema.user)
              .set({ image })
              .where(eq(schema.user.id, newSession.user.id));
          }
        }
      }
    }),
  },
});
