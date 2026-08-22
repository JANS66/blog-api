import { Link, useNavigate } from "react-router-dom";
import {
  Group,
  Button,
  Avatar,
  Menu,
  Text,
  UnstyledButton,
  Container,
  Box,
  Divider,
} from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/useAuth";
import { logoutUser } from "../api/auth";

export default function HeaderBar() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isCreator =
    isAuthenticated && (user?.role === "AUTHOR" || user?.role === "ADMIN");

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: async () => {
      // Explicitly clear the user entry so AuthProvider instantly sees user = null
      queryClient.setQueryData(["currentUser"], { user: null });

      queryClient.clear();

      navigate("/login");
    },
  });

  return (
    <Box
      bg="var(--mantine-color-body)"
      style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
    >
      <Container size="lg" h={60}>
        <Group justify="space-between" h="100%">
          {/* Logo / Home Link */}
          <UnstyledButton component={Link} to="/">
            <Text fw={700} size="lg">
              BlogApp
            </Text>
          </UnstyledButton>

          {/* Right Navigation Options */}
          <Group gap="md">
            {isAuthenticated ? (
              <>
                {/* Direct CTA for Authors and Admins */}
                {isCreator && (
                  <Button
                    component={Link}
                    to="/posts/create"
                    variant="filled"
                    color="blue"
                    size="sm"
                  >
                    + Write Post
                  </Button>
                )}

                {/* User Avatar Menu */}
                <Menu shadow="md" width={200} position="bottom-end">
                  <Menu.Target>
                    <UnstyledButton style={{ cursor: "pointer" }}>
                      <Group gap="xs">
                        <Avatar src={user?.avatarUrl} radius="xl" color="blue">
                          {user?.username?.[0]?.toUpperCase()}
                        </Avatar>
                        <Text size="sm" fw={500}>
                          {user?.username}
                        </Text>
                      </Group>
                    </UnstyledButton>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Label>Application</Menu.Label>

                    {isCreator && (
                      <Menu.Item component={Link} to="/posts/create">
                        Create Post
                      </Menu.Item>
                    )}

                    <Menu.Item component={Link} to={`/users/${user?.username}`}>
                      My Profile
                    </Menu.Item>
                    <Menu.Item component={Link} to="/edit-profile">
                      Edit Profile
                    </Menu.Item>

                    <Divider my="xs" />

                    <Menu.Item
                      color="red"
                      onClick={() => logoutMutation.mutate()}
                    >
                      Logout
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </>
            ) : (
              <Group gap="sm">
                <Button variant="default" component={Link} to="/login">
                  Log in
                </Button>
                <Button component={Link} to="/register">
                  Sign up
                </Button>
              </Group>
            )}
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
