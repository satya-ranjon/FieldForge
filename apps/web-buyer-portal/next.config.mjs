// NOTE: API_GATEWAY_URL is evaluated during 'next build' and statically baked into
// routes-manifest.json. Changing container runtime environment will NOT retarget rewrites.
const apiGatewayUrl =
  process.env.API_GATEWAY_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'http://api-gateway-service:8000'
    : 'http://localhost:8000');

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
        destination: `${apiGatewayUrl}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
