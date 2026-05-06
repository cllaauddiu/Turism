import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth", "routes/auth.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
] satisfies RouteConfig;

