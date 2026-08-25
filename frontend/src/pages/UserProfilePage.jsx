import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Container,
  Paper,
  Avatar,
  Title,
  Text,
  Group,
  Stack,
  Card,
  Image,
  Pagination,
  Button,
  Skeleton,
  Alert,
  Grid,
  Tabs,
  Badge,
} from "@mantine/core";
import { getUserByUsername } from "../api/users";
import { useAuth } from "../context/useAuth";
import DeleteUserButton from "../components/DeleteUserButton";

export default function UserProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("published");
  const navigate = useNavigate();
  const location = useLocation();
  const limit = 6; // Posts per page

  // Local state for flash message from navigation
  const [flashMessage, setFlashMessage] = useState(
    location.state?.message || null,
  );

  // Clear location.state from browser history so refreshes dont retrigger the alert
  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const isOwnProfile =
    currentUser?.username?.toLowerCase() === username?.toLowerCase();
  const isAdmin = currentUser?.role === "ADMIN";
  const isOwnerOrAdmin = isOwnProfile || isAdmin;

  // Handle tab switches: Change active tab state and reset pagination to page 1
  const handleTabChange = (newTab) => {
    if (!newTab) return;
    setActiveTab(newTab);
    setPage(1);
  };

  const { data, isLoading, isError, error, isPlaceholderData } = useQuery({
    queryKey: ["userProfile", username, activeTab, page],
    queryFn: () =>
      getUserByUsername(username, page, limit, activeTab.toUpperCase()),
    enabled: Boolean(username), // Prevents query execution if username is missing/undefined
    placeholderData: keepPreviousData,
  });

  if (isLoading) {
    return (
      <Container size="lg" my={40}>
        <Paper p={30} radius="md" withBorder mb="xl">
          <Group>
            <Skeleton height={90} circle />
            <Stack gap="xs">
              <Skeleton height={24} width={180} />
              <Skeleton height={16} width={250} />
            </Stack>
          </Group>
        </Paper>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container size="md" my={40}>
        <Alert color="red" title="Error">
          {error.response?.data?.error || "Failed to load user profile."}
        </Alert>
      </Container>
    );
  }

  const { user, posts, counts, pagination } = data;

  return (
    <Container size="lg" my={40}>
      {/* Flash / Success Message Banner */}
      {flashMessage && (
        <Alert
          color="teal"
          title="Success"
          withCloseButton
          onClose={() => setFlashMessage(null)}
          mb="xl"
        >
          {flashMessage}
        </Alert>
      )}

      {/* User Header Info */}
      <Paper p={30} radius="md" withBorder mb="xl">
        <Group justify="space-between" align="flex-start">
          <Group align="center" gap="lg">
            <Avatar src={user?.avatarUrl} size={90} radius="xl" color="blue">
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
            <Stack gap={4}>
              <Group gap="xs">
                <Title order={2}>{user?.username}</Title>
              </Group>
              <Text size="sm" c="dimmed">
                Joined {new Date(user?.createdAt).toLocaleDateString()}
              </Text>
              {user?.bio && (
                <Text size="sm" mt="xs" style={{ maxWidth: 600 }}>
                  {user.bio}
                </Text>
              )}
            </Stack>
          </Group>

          <Group>
            {isOwnProfile && (
              <Button component={Link} to="/edit-profile" variant="outline">
                Edit Profile
              </Button>
            )}

            {isAdmin && !isOwnProfile && (
              <DeleteUserButton
                userId={user.id}
                username={user.username}
                onSuccess={() => navigate("/")}
              />
            )}
          </Group>
        </Group>
      </Paper>

      {/* Main Content / Tabs */}
      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tabs.List mb="lg">
          <Tabs.Tab value="published">
            Published ({counts?.published || 0})
          </Tabs.Tab>

          {isOwnerOrAdmin && (
            <Tabs.Tab value="draft" color="yellow">
              Drafts ({counts?.drafts || 0})
            </Tabs.Tab>
          )}
        </Tabs.List>

        {/* Dynamic Panel for Active Tab */}
        <Tabs.Panel value={activeTab}>
          {posts?.length === 0 ? (
            <Paper p={30} radius="md" withBorder ta="center">
              <Text c="dimmed">
                {activeTab === "draft"
                  ? "You have no draft posts."
                  : "This user hasn't published any posts yet."}
              </Text>
            </Paper>
          ) : (
            <>
              <Grid mb="xl">
                {posts.map((post) => (
                  <Grid.Col key={post.id} span={{ base: 12, sm: 6, md: 4 }}>
                    <Card
                      shadow="sm"
                      padding="lg"
                      radius="md"
                      withBorder
                      style={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderColor:
                          post.status === "DRAFT"
                            ? "var(--mantine-color-yellow-4)"
                            : undefined,
                      }}
                    >
                      {post.status === "DRAFT" && (
                        <Group justify="space-between" mb="xs">
                          <Badge color="yellow" variant="filled">
                            DRAFT
                          </Badge>
                        </Group>
                      )}

                      {post.coverImage && (
                        <Card.Section mb="sm">
                          <Image
                            src={post.coverImage}
                            height={160}
                            alt={post.title}
                          />
                        </Card.Section>
                      )}

                      <Text
                        fw={600}
                        size="lg"
                        lineClamp={2}
                        mb="xs"
                        component={Link}
                        to={`/posts/${post.slug}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        {post.title}
                      </Text>

                      {post.excerpt && (
                        <Text size="sm" c="dimmed" lineClamp={3} mb="md">
                          {post.excerpt}
                        </Text>
                      )}

                      <Group justify="space-between" mt="auto">
                        <Text size="xs" c="dimmed">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </Text>
                        <Group gap="xs">
                          {post.status === "PUBLISHED" ? (
                            <Button
                              component={Link}
                              to={`/posts/${post.slug}`}
                              variant="light"
                              size="xs"
                            >
                              Read
                            </Button>
                          ) : (
                            <Button
                              component={Link}
                              to={`/posts/${post.slug}/edit`}
                              variant="filled"
                              color="yellow"
                              size="xs"
                            >
                              Edit Draft
                            </Button>
                          )}
                        </Group>
                      </Group>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>

              {/* Pagination Controls */}
              {pagination?.totalPages > 1 && (
                <Group justify="center" mt="xl">
                  <Pagination
                    total={pagination.totalPages}
                    value={page}
                    onChange={setPage}
                    disabled={isPlaceholderData}
                  />
                </Group>
              )}
            </>
          )}
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
