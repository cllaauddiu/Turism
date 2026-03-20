import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { AuthProvider } from "~/hooks/useAuth";
import "~/app.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-950 text-white min-h-screen">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

