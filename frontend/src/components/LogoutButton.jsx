import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@mantine/core";
import { logoutUser } from "../api/auth";

export default function LogoutButton({
  variant = "outline",
  color = "red",
  ...props
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      // Clear all cached React Query data
      queryClient.clear();
      // Redirect user to login route
      navigate("/login");
    },
    onError: (error) => {
      console.error("Logout failed:", error);
    },
  });

  return (
    <Button
      variant={variant}
      color={color}
      loading={mutation.isPending}
      onClick={() => mutation.mutate()}
      {...props}
    >
      Logout
    </Button>
  );
}
