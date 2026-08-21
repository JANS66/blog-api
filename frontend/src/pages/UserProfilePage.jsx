import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
} from "@mantine/core";
import { getUserByUsername } from "../api/users";
import { useAuth } from "../context/useAuth";
import DeleteUserButton from "../components/DeleteUserButton";

export default function UserProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const limit = 6; // Posts per page

  const { data, isLoading, isError, error, isPlaceholderData } = useQuery({
    queryKey: ["userProfile", username, page],
    queryFn: () => getUserByUsername(username, page, limit),
    retry: (failureCount, error) => {
      // If the server explicitly said 404, dont waste time retrying
      if (error.response?.status === 404) return false;

      // Retry up to 2 times for 500 server errors or connection drops
      return failureCount < 2;
    },
    refetchOnWindowFocus: false, // Stop refetching when changing tabs
    placeholderData: keepPreviousData,
  });

  const isOwnProfile =
    currentUser?.username?.toLowerCase() === username?.toLowerCase();
  const isAdmin = currentUser?.role === "ADMIN";

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

  const { user, posts, pagination } = data;

  return (
    <Container size="lg" my={40}>
      {/* User Header Info */}
      <Paper p={30} radius="md" withBorder mb="xl">
        <Group justify="space-between" align="flex-start">
          <Group align="center" gap="lg">
            <Avatar src={user?.avatarUrl} size={90} radius="xl" color="blue">
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
            <Stack gap={4}>
              <Title order={2}>{user?.username}</Title>
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
      </Paper>

      {/* Published Posts Section */}
      <Title order={3} mb="md">
        Published Posts ({pagination?.totalPosts || 0})
      </Title>

      {posts?.length === 0 ? (
        <Paper p={30} radius="md" withBorder ta="center">
          <Text c="dimmed">This user hasn't published any posts yet.</Text>
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
                  component={Link}
                  to={`/posts/${post.slug}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    height: "100%",
                  }}
                >
                  {post.coverImage && (
                    <Card.Section mb="sm">
                      <Image
                        src={post.coverImage}
                        height={160}
                        alt={post.title}
                      />
                    </Card.Section>
                  )}

                  <Text fw={600} size="lg" lineClamp={2} mb="xs">
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
    </Container>
  );
}
