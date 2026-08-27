import { Navigate, Outlet } from "react-router-dom";
import { LoadingOverlay, Box } from "@mantine/core";
import { useAuth } from "../../context/useAuth";

export default function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box h="100vh" pos="relative">
        <LoadingOverlay
          visible={true}
          zIndex={1000}
          overlayProps={{ radius: "sm", blur: 2 }}
        />
      </Box>
    );
  }

  // If user is already logged in, redirect away from auth pages to home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If user is NOT logged in, allow access to login/register
  return <Outlet />;
}
