// public-env.ts
import { createPublicEnv } from "next-public-env";

export const { getPublicEnv, PublicEnv } = createPublicEnv(
  {
    NODE_ENV: process.env.NODE_ENV,
    UPLOAD_CHUNK_SIZE: process.env.UPLOAD_CHUNK_SIZE,
    REQUIRE_EMAIL_VERIFICATION: process.env.REQUIRE_EMAIL_VERIFICATION,
    DISABLE_SIGN_UP: process.env.DISABLE_SIGN_UP,
    DISABLE_EMAIL_PASSWORD_AUTH: process.env.DISABLE_EMAIL_PASSWORD_AUTH,
    OPENID_ID: process.env.OPENID_ID,
    OPENID_NAME: process.env.OPENID_NAME,
  },
  {
    schema: (z) => ({
      NODE_ENV: z.enum(["development", "production", "test"]),
      UPLOAD_CHUNK_SIZE: z
        .string()
        .default((5 * 1024 * 1024 * 1024).toString()), // 5GB (effectively disabling chunking unless explicitly configured)
      REQUIRE_EMAIL_VERIFICATION: z.enum(["true", "false"]).default("false"),
      DISABLE_SIGN_UP: z.enum(["true", "false"]).default("false"),
      DISABLE_EMAIL_PASSWORD_AUTH: z.enum(["true", "false"]).default("false"),
      OPENID_ID: z.string().nullable().default(null),
      OPENID_NAME: z.string().nullable().default(null),
    }),
  }
);
