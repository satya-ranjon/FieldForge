/** @type {import('next').NextConfig} */
const nextConfig = {
  // @ts-ignore Next.js 16 internal option: disable auto-generating AGENTS.md / CLAUDE.md in subpackage
  agentRules: false,
  output: 'standalone',
  transpilePackages: ['@fieldforge/contracts', '@fieldforge/ui'],
  reactStrictMode: true,
  typedRoutes: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*'
      }
    ];
  }
};

export default nextConfig;
