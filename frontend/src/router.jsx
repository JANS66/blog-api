import { createBrowserRouter } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";

export const router = createBrowserRouter([
  // Guest Only Routes (Redirects logged in users to '/')
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "/register",
        element: <RegisterPage />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
    ],
  },
  // Protected Routes (Redirects unauthenticated users to "/login")
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <div>Protected Home Page</div>,
      },
    ],
  },
]);
