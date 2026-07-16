/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Verification builds can set NEXT_DIST_DIR (e.g. ".next-verify") so that
  // `next build` never clobbers the .next cache of a running dev server —
  // that clobbering is what made the site render unstyled mid-session.
  // Deploys (Railway) leave the env unset and use the default .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Verification builds on a memory-pressured machine can set NEXT_BUILD_CPUS
  // to throttle static-generation workers (default parallelism OOMs when the
  // system commit charge is near its limit). Deploys leave the env unset.
  ...(process.env.NEXT_BUILD_CPUS
    ? { experimental: { cpus: Number(process.env.NEXT_BUILD_CPUS) } }
    : {}),
};

export default nextConfig;
