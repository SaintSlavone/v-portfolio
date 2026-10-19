import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,
	output: "standalone",
	allowedDevOrigins: ["192.168.0.175"],
};

export default nextConfig;
