import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" }
    }),
    nitro({
      preset: 'vercel'
    }),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        // Without this, superseded precaches linger and the installed PWA keeps
        // serving the previous JS bundle — which is why a reinstall was needed
        // before new Xora code took effect.
        cleanupOutdatedCaches: true,
        // Never let the SPA fallback swallow API calls: /api/xora must always
        // hit the network, never a cached document.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
      },
      includeAssets: ['favicon.ico', 'logo.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'NaijaEats',
        short_name: 'NaijaEats',
        description: 'Order from chefs, African & Caribbean restaurants, and ethnic groceries.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: { host: "::", port: 8080 }
});
