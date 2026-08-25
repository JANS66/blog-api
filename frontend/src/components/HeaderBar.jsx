import { Link, useNavigate } from "react-router-dom";
import { useMediaQuery } from "@mantine/hooks";
import {
  Box,
  Container,
  Group,
  UnstyledButton,
  Text,
  Button,
  Menu,
  Avatar,
  Divider,
  ActionIcon,
  useMantineTheme,
} from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/useAuth";
import { logoutUser } from "../api/auth";

export default function HeaderBar() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useMantineTheme();

  // Check if screen is smaller than medium breakpoint (768px)
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

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
          <Group gap="sm">
            <Button
              component={Link}
              to="/categories"
              variant="subtle"
              color="gray"
              size="sm"
            >
              Categories
            </Button>

            {isAuthenticated ? (
              <>
                {/* Write Post: Full button on desktop, Icon-only on mobile */}
                {isCreator &&
                  (isMobile ? (
                    <ActionIcon
                      component={Link}
                      to="/posts/create"
                      variant="filled"
                      color="blue"
                      size="lg"
                      radius="md"
                      title="Write Post"
                    >
                      +
                    </ActionIcon>
                  ) : (
                    <Button
                      component={Link}
                      to="/posts/create"
                      variant="filled"
                      color="blue"
                      size="sm"
                    >
                      + Write Post
                    </Button>
                  ))}

                {/* Profile Avatar Menu */}
                <Menu shadow="md" width={200} position="bottom-end">
                  <Menu.Target>
                    <UnstyledButton style={{ cursor: "pointer" }}>
                      <Group gap="xs">
                        <Avatar
                          src={user?.avatarUrl}
                          radius="xl"
                          color="blue"
                          size="sm"
                        >
                          {user?.username?.[0]?.toUpperCase()}
                        </Avatar>
                        {/* Hide username text on mobile screens */}
                        {!isMobile && (
                          <Text size="sm" fw={500}>
                            {user?.username}
                          </Text>
                        )}
                      </Group>
                    </UnstyledButton>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Label>Application</Menu.Label>

                    {/* Move Categories into menu on mobile as fallback */}
                    {isMobile && (
                      <Menu.Item component={Link} to="/categories">
                        Categories
                      </Menu.Item>
                    )}

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
