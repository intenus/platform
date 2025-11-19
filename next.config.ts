import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["@mysten/walrus", "@mysten/walrus-wasm", "@intenus/walrus"],
};

export default nextConfig;
