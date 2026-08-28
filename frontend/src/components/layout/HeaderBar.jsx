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
import { useAuth } from "../../context/useAuth";
import { logoutUser } from "../../api/auth";
import { IconChevronDown } from "@tabler/icons-react";

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
      {/* Px for mobile padding and wrap protection */}
      <Container size="lg" h={60} px={{ base: "xs", sm: "md" }}>
        <Group justify="space-between" h="100%" wrap="nowrap">
          {/* Left: Logo & Desktop Links */}
          <Group gap="xs" wrap="nowrap">
            <UnstyledButton component={Link} to="/">
              <Text fw={700} size="lg">
                BlogApp
              </Text>
            </UnstyledButton>

            {/* Desktop Only Navigation */}
            {!isMobile && (
              <Group gap="xs">
                <Button
                  component={Link}
                  to="/categories"
                  variant="subtle"
                  color="gray"
                  size="sm"
                >
                  Categories
                </Button>
                <Button
                  component={Link}
                  to="/tags"
                  variant="subtle"
                  color="gray"
                  size="sm"
                >
                  Tags
                </Button>
              </Group>
            )}
          </Group>

          {/* Right Navigation Options */}
          <Group gap={isMobile ? 6 : "sm"} wrap="nowrap">
            {/* Mobile Only "Explore" Dropdown */}
            {isMobile && (
              <Menu shadow="md" width={160} position="bottom-end">
                <Menu.Target>
                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    rightSection={<IconChevronDown size={14} />}
                    px={6}
                  >
                    Explore
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item component={Link} to="/categories">
                    Categories
                  </Menu.Item>
                  <Menu.Item component={Link} to="/tags">
                    Tags
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}

            {isAuthenticated ? (
              <>
                {/* Write Post Action */}
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

                {/* Profile Avatar Menu (Account specific only) */}
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
                        {!isMobile && (
                          <Text size="sm" fw={500}>
                            {user?.username}
                          </Text>
                        )}
                      </Group>
                    </UnstyledButton>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Label>Account</Menu.Label>
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
              /* Button sizes 'xs' on mobile so they dont break boundaries */
              <Group gap={6} wrap="nowrap">
                <Button
                  variant="default"
                  size={isMobile ? "xs" : "sm"}
                  component={Link}
                  to="/login"
                  px={isMobile ? 8 : undefined}
                >
                  Log in
                </Button>
                <Button
                  size={isMobile ? "xs" : "sm"}
                  component={Link}
                  to="/register"
                  px={isMobile ? 8 : undefined}
                >
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
