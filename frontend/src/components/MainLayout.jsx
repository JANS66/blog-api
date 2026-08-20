import { Outlet } from "react-router-dom";
import { Box } from "@mantine/core";
import HeaderBar from "./HeaderBar";

export default function MainLayout() {
  return (
    <Box
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <HeaderBar />
      <Box component="main" style={{ flex: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
