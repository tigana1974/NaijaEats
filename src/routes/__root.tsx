import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/hooks/useCart";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-4 p-4 bg-red-50 text-red-900 text-xs rounded-md text-left overflow-auto border border-red-200">
          <strong>Error details:</strong>
          <br />
          {error?.message || "Unknown error occurred"}
          {error?.stack && (
            <pre className="mt-2 whitespace-pre-wrap">{error.stack}</pre>
          )}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Naija Eats — The Home of African & Authentic Food" },
      { name: "description", content: "Order from home chefs, African & Caribbean restaurants, ethnic groceries, and book personal chefs. Cooked with culture, delivered fresh." },
      { name: "author", content: "Naija Eats" },
      { property: "og:title", content: "Naija Eats — The Home of African & Authentic Food" },
      { property: "og:description", content: "Order from home chefs, African & Caribbean restaurants, ethnic groceries, and book personal chefs. Cooked with culture, delivered fresh." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },

      { name: "twitter:title", content: "Naija Eats — The Home of African & Authentic Food" },
      { name: "twitter:description", content: "Order from home chefs, African & Caribbean restaurants, ethnic groceries, and book personal chefs. Cooked with culture, delivered fresh." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/WwfEWjKFFmQR7zXd4Diy2oZplB92/social-images/social-1780595681268-Naija_Eats_logo_Transparent_2.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/WwfEWjKFFmQR7zXd4Diy2oZplB92/social-images/social-1780595681268-Naija_Eats_logo_Transparent_2.webp" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400..800;1,400..800&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster richColors position="top-center" />
      </CartProvider>
    </QueryClientProvider>
  );
}
