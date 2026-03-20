import { Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RouteGuard from "./RouteGuard";
import type { RouteAccess } from "./access";

const Home = lazy(() => import("../pages/Home"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Forbidden = lazy(() => import("../pages/Forbidden"));

type AppRouteConfig = {
  path: string;
  component: typeof Home;
  access?: RouteAccess;
};

const appRoutes: AppRouteConfig[] = [
  {
    path: "/",
    component: Home,
  },
  {
    path: "/dashboard",
    component: Dashboard,
    access: {
      requiresAuth: true,
    },
  },
  {
    path: "/login",
    component: Login,
  },
  {
    path: "/register",
    component: Register,
  },
  {
    path: "/403",
    component: Forbidden,
  },
];

const router = createBrowserRouter(
  appRoutes.map(({ path, component: Component, access }) => ({
    path,
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <RouteGuard access={access}>
          <Component />
        </RouteGuard>
      </Suspense>
    ),
  })),
);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
