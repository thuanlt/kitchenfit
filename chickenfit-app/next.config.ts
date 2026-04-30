import type { NextConfig } from "next";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: true, // Temporarily disable PWA
  register: true,
  skipWaiting: true,
  customWorkerDir: 'worker',
  buildExcludes: [/app-build-manifest\.json$/],
});

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default withPWA(nextConfig);