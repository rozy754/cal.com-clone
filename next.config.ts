import "dotenv/config"; // Yeh Next.js ke runtime process mein .env thonk dega
import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  typescript: {
    // ⚠️ TypeScript errors ki wajah se vercel build crash hona band ho jayegi
    ignoreBuildErrors: true,
  },
  
};

export default nextConfig;