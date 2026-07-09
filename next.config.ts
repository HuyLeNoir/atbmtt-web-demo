import type { NextConfig } from "next";

const nextConfig: NextConfig = {};
module.exports = {
    experimental: {
        serverActions: {
            bodySizeLimit: "10mb",
        },
    },
};
export default nextConfig;
