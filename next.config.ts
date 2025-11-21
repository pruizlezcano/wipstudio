import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_UPLOAD_CHUNK_SIZE: process.env.UPLOAD_CHUNK_SIZE,
  },
};

export default nextConfig;
