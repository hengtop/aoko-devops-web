import { Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLoading from "../components/AppLoading";
import RouteGuard from "./RouteGuard";
import type { RouteAccess } from "./access";

const Home = lazy(() => import("../pages/Home"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Configuration = lazy(() => import("../pages/Configuration"));
const ConfigurationEditor = lazy(() => import("../pages/ConfigurationEditor"));
const Template = lazy(() => import("../pages/Template"));
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
    path: "/template",
    component: Template,
    access: {
      requiresAuth: true,
    },
  },
  {
    path: "/configuration",
    component: Configuration,
    access: {
      requiresAuth: true,
    },
  },
  {
    path: "/configuration/create",
    component: ConfigurationEditor,
    access: {
      requiresAuth: true,
    },
  },
  {
    path: "/configuration/:id",
    component: ConfigurationEditor,
    access: {
      requiresAuth: true,
    },
  },
  {
    path: "/configuration/:id/edit",
    component: ConfigurationEditor,
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
      <Suspense fallback={<AppLoading />}>
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
