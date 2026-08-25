import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { router } from "./router";
import "@mantine/core/styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes globally
      refetchOnWindowFocus: false, // Stop auto refetching when switching browser tabs
      retry: (failureCount, error) => {
        // Dont waste time retrying 404 Not Found errors
        if (error.response?.status === 404) return false;
        // Retry up to 2 times for 500 server errors of network drops
        return failureCount < 2;
      },
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </MantineProvider>
    </QueryClientProvider>
  </StrictMode>,
);
