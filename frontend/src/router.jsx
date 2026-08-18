import { createBrowserRouter } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";

export const router = createBrowserRouter([
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/",
    element: <div>Home Page</div>,
  },
]);
