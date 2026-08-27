import { Navigate, Outlet } from "react-router-dom";
import { LoadingOverlay, Box } from "@mantine/core";
import { useAuth } from "../../context/useAuth";

export default function AdminRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

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

  // Must be authenticated AND have role === "ADMIN"
  if (!isAuthenticated || user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
