import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_UPLOAD_CHUNK_SIZE: process.env.UPLOAD_CHUNK_SIZE,
    NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION:
      process.env.REQUIRE_EMAIL_VERIFICATION,
    NEXT_PUBLIC_DISABLE_SIGN_UP: process.env.DISABLE_SIGN_UP,
  },
};

export default nextConfig;
