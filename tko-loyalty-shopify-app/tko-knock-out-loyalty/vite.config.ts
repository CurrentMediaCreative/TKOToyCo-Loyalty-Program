import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig, type UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals({ nativeFetch: true });

// Disable HMR in production to avoid DNS lookup issues
const isLocalhost =
  !process.env.SHOPIFY_APP_URL ||
  process.env.SHOPIFY_APP_URL.includes("localhost");

// Only enable HMR for local development
let hmrConfig: any = false;
if (isLocalhost) {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
}

export default defineConfig({
  server: {
    allowedHosts: ["localhost", "tkotoyco-loyalty-program.onrender.com"],
    cors: {
      preflightContinue: true,
    },
    port: Number(process.env.PORT || 56552), // Dynamic port for Render compatibility, fallback to 56552 for local dev
    hmr: hmrConfig,
    fs: {
      // See https://vitejs.dev/config/server-options.html#server-fs-allow for more information
      allow: ["app", "node_modules"],
    },
  },
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: true,
        v3_singleFetch: false,
        v3_routeConfig: true,
      },
    }),
    tsconfigPaths(),
  ],
  build: {
    assetsInlineLimit: 0,
  },
  optimizeDeps: {
    include: ["@shopify/app-bridge-react", "@shopify/polaris"],
  },
}) satisfies UserConfig;
