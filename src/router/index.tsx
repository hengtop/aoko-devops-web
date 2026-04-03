import { Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLoading from "../components/AppLoading";
import ConsoleLayout from "./ConsoleLayout";
import RouteGuard from "./RouteGuard";

const Home = lazy(() => import("../pages/Home"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Configuration = lazy(() => import("../pages/Configuration"));
const ConfigurationEditor = lazy(() => import("../pages/ConfigurationEditor"));
const Message = lazy(() => import("../pages/Message"));
const MessageDetail = lazy(() => import("../pages/MessageDetail"));
const MessageManage = lazy(() => import("../pages/MessageManage"));
const MessagePublishEditor = lazy(() => import("../pages/MessagePublishEditor"));
const Server = lazy(() => import("../pages/Server"));
const Template = lazy(() => import("../pages/Template"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Forbidden = lazy(() => import("../pages/Forbidden"));

type AppRouteConfig = {
  path: string;
  component: typeof Home;
};

const consoleRoutes: AppRouteConfig[] = [
  {
    path: "/dashboard",
    component: Dashboard,
  },
  {
    path: "/template",
    component: Template,
  },
  {
    path: "/configuration",
    component: Configuration,
  },
  {
    path: "/server",
    component: Server,
  },
  {
    path: "/message",
    component: Message,
  },
  {
    path: "/message/:id",
    component: MessageDetail,
  },
  {
    path: "/message/manage",
    component: MessageManage,
  },
  {
    path: "/message/manage/create",
    component: MessagePublishEditor,
  },
  {
    path: "/message/manage/:id",
    component: MessagePublishEditor,
  },
  {
    path: "/message/manage/:id/edit",
    component: MessagePublishEditor,
  },
  {
    path: "/configuration/create",
    component: ConfigurationEditor,
  },
  {
    path: "/configuration/:id",
    component: ConfigurationEditor,
  },
  {
    path: "/configuration/:id/edit",
    component: ConfigurationEditor,
  },
];

const consoleChildRoutes = consoleRoutes.map(({ path, component: Component }) => ({
  path,
  element: <Component />,
}));

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<AppLoading />}>
        <Home />
      </Suspense>
    ),
  },
  {
    element: (
      <Suspense fallback={<AppLoading />}>
        <RouteGuard access={{ requiresAuth: true }}>
          <ConsoleLayout />
        </RouteGuard>
      </Suspense>
    ),
    children: consoleChildRoutes,
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<AppLoading />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: "/register",
    element: (
      <Suspense fallback={<AppLoading />}>
        <Register />
      </Suspense>
    ),
  },
  {
    path: "/403",
    element: (
      <Suspense fallback={<AppLoading />}>
        <Forbidden />
      </Suspense>
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
