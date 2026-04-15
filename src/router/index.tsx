import { Suspense, lazy, type ComponentType } from "react";
import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLoading from "@components/AppLoading";
import { APP_ROUTE_PATHS } from "@constants";
import ConsoleLayout from "./ConsoleLayout";
import RouteGuard from "./RouteGuard";

const ApprovalInstance = lazy(() => import("@pages/ApprovalInstance"));
const ApprovalInstanceEditor = lazy(() => import("@pages/ApprovalInstanceEditor"));
const ApprovalPolicy = lazy(() => import("@pages/ApprovalPolicy"));
const ApprovalPolicyEditor = lazy(() => import("@pages/ApprovalPolicyEditor"));
const ApprovalTask = lazy(() => import("@pages/ApprovalTask"));
const ApprovalTemplate = lazy(() => import("@pages/ApprovalTemplate"));
const ApprovalTemplateEditor = lazy(() => import("@pages/ApprovalTemplateEditor"));
const Home = lazy(() => import("@pages/Home"));
const Dashboard = lazy(() => import("@pages/Dashboard"));
const Configuration = lazy(() => import("@pages/Configuration"));
const ConfigurationEditor = lazy(() => import("@pages/ConfigurationEditor"));
const Message = lazy(() => import("@pages/Message"));
const MessageDetail = lazy(() => import("@pages/MessageDetail"));
const MessageManage = lazy(() => import("@pages/MessageManage"));
const MessagePublishEditor = lazy(() => import("@pages/MessagePublishEditor"));
const Server = lazy(() => import("@pages/Server"));
const Template = lazy(() => import("@pages/Template"));
const Login = lazy(() => import("@pages/Login"));
const Register = lazy(() => import("@pages/Register"));
const Forbidden = lazy(() => import("@pages/Forbidden"));

type AppRouteConfig = {
  path: string;
  component: ComponentType;
};

const consoleRoutes: AppRouteConfig[] = [
  {
    path: APP_ROUTE_PATHS.DASHBOARD,
    component: Dashboard,
  },
  {
    path: APP_ROUTE_PATHS.APPROVAL,
    component: () => <Navigate to={APP_ROUTE_PATHS.APPROVAL_TEMPLATE} replace />,
  },
  {
    path: APP_ROUTE_PATHS.APPROVAL_TEMPLATE,
    component: ApprovalTemplate,
  },
  {
    path: APP_ROUTE_PATHS.APPROVAL_TEMPLATE_CREATE,
    component: ApprovalTemplateEditor,
  },
  {
    path: APP_ROUTE_PATHS.APPROVAL_TEMPLATE_EDIT,
    component: ApprovalTemplateEditor,
  },
  {
    path: APP_ROUTE_PATHS.APPROVAL_POLICY,
    component: ApprovalPolicy,
  },
  {
    path: APP_ROUTE_PATHS.APPROVAL_POLICY_CREATE,
    component: ApprovalPolicyEditor,
  },
  {
    path: APP_ROUTE_PATHS.APPROVAL_POLICY_EDIT,
    component: ApprovalPolicyEditor,
  },
  {
    path: APP_ROUTE_PATHS.APPROVAL_INSTANCE,
    component: ApprovalInstance,
  },
  {
    path: APP_ROUTE_PATHS.APPROVAL_INSTANCE_CREATE,
    component: ApprovalInstanceEditor,
  },
  {
    path: APP_ROUTE_PATHS.APPROVAL_TASK,
    component: ApprovalTask,
  },
  {
    path: APP_ROUTE_PATHS.TEMPLATE,
    component: Template,
  },
  {
    path: APP_ROUTE_PATHS.CONFIGURATION,
    component: Configuration,
  },
  {
    path: APP_ROUTE_PATHS.SERVER,
    component: Server,
  },
  {
    path: APP_ROUTE_PATHS.MESSAGE,
    component: Message,
  },
  {
    path: APP_ROUTE_PATHS.MESSAGE_DETAIL,
    component: MessageDetail,
  },
  {
    path: APP_ROUTE_PATHS.MESSAGE_MANAGE,
    component: MessageManage,
  },
  {
    path: APP_ROUTE_PATHS.MESSAGE_MANAGE_CREATE,
    component: MessagePublishEditor,
  },
  {
    path: APP_ROUTE_PATHS.MESSAGE_MANAGE_DETAIL,
    component: MessagePublishEditor,
  },
  {
    path: APP_ROUTE_PATHS.MESSAGE_MANAGE_EDIT,
    component: MessagePublishEditor,
  },
  {
    path: APP_ROUTE_PATHS.CONFIGURATION_CREATE,
    component: ConfigurationEditor,
  },
  {
    path: APP_ROUTE_PATHS.CONFIGURATION_DETAIL,
    component: ConfigurationEditor,
  },
  {
    path: APP_ROUTE_PATHS.CONFIGURATION_EDIT,
    component: ConfigurationEditor,
  },
];

const consoleChildRoutes = consoleRoutes.map(({ path, component: Component }) => ({
  path,
  element: <Component />,
}));

const router = createBrowserRouter([
  {
    path: APP_ROUTE_PATHS.HOME,
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
    path: APP_ROUTE_PATHS.LOGIN,
    element: (
      <Suspense fallback={<AppLoading />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: APP_ROUTE_PATHS.REGISTER,
    element: (
      <Suspense fallback={<AppLoading />}>
        <Register />
      </Suspense>
    ),
  },
  {
    path: APP_ROUTE_PATHS.FORBIDDEN,
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
