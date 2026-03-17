import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@compliancecore/ui', '@compliancecore/shared'],
};

export default nextConfig;
