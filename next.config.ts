import type { NextConfig } from "next";

const devOrigin = process.env.DEV_ORIGIN?.trim();
const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const backendImagePattern = (() => {
  if (!apiUrl) return undefined;

  try {
    const url = new URL(apiUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;

    return {
      protocol: url.protocol === "https:" ? ("https" as const) : ("http" as const),
      hostname: url.hostname,
      port: url.port,
      pathname: "/**",
    };
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  output: "standalone",
  ...(devOrigin ? { allowedDevOrigins: [devOrigin] } : {}),
  images: {
    remotePatterns: backendImagePattern ? [backendImagePattern] : [],
  },
};

export default nextConfig;
