import { createBrowserRouter, Navigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import EditProfilePage from "./pages/EditProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import HomePage from "./pages/HomePage";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import MainLayout from "./components/MainLayout";

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      // Public / Guest / Logged in shared routes
      { path: "/", element: <HomePage /> },
      { path: "/users/:username", element: <UserProfilePage /> },

      // Guest Only Routes
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: "/register", element: <RegisterPage /> },
          { path: "/login", element: <LoginPage /> },
        ],
      },
      // Protected Routes
      {
        element: <ProtectedRoute />,
        children: [{ path: "/edit-profile", element: <EditProfilePage /> }],
      },
      // Fallback redirect
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
