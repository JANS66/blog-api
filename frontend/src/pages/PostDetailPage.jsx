import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Container,
  Title,
  Text,
  Image,
  Badge,
  Group,
  Avatar,
  Paper,
  Stack,
  Skeleton,
  Alert,
  Divider,
  Box,
} from "@mantine/core";
import { getPostBySlug } from "../api/posts";

export default function PostDetailPage() {
  const { slug } = useParams();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["post", slug],
    queryFn: () => getPostBySlug(slug),
    retry: (failureCount, error) => {
      // If the server explicitly said 404, dont waste time retrying
      if (error.response?.status === 404) return false;

      // Retry up to 2 times for 500 server errors or connection drops
      return failureCount < 2;
    },
    refetchOnWindowFocus: false, // Stop refetching when changing tabs
  });

  if (isLoading) {
    return (
      <Container size="md" my={40}>
        <Skeleton height={300} mb="lg" radius="md" />
        <Skeleton height={40} width="70%" mb="sm" />
        <Skeleton height={20} width="40%" mb="xl" />
        <Skeleton height={150} mb="sm" />
      </Container>
    );
  }

  if (isError) {
    return (
      <Container size="md" my={40}>
        <Alert color="red" title="Error">
          {error.response?.data?.error || "Failed to load post."}
        </Alert>
      </Container>
    );
  }

  const { post } = data;

  return (
    <Container size="md" my={40}>
      <Stack gap="lg">
        {/* Category and Date */}
        <Group justify="space-between">
          {post.category ? (
            <Badge
              color="blue"
              variant="light"
              component={Link}
              to={`/?category=${post.category.slug}`}
              style={{ cursor: "pointer" }}
            >
              {post.category.name}
            </Badge>
          ) : (
            <div />
          )}

          <Text size="xs" c="dimmed">
            {post.viewsCount} {post.viewsCount === 1 ? "view" : "views"}
          </Text>
        </Group>

        {/* Title */}
        <Title order={1}>{post.title}</Title>

        {/* Author Details */}
        <Paper p="sm" radius="md" withBorder>
          <Group justify="space-between">
            <Group gap="sm">
              <Avatar src={post.author?.avatarUrl} radius="xl" size="md">
                {post.author?.username?.[0]?.toUpperCase()}
              </Avatar>
              <div>
                <Text
                  fw={600}
                  size="sm"
                  component={Link}
                  to={`/users/${post.author?.username}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {post.author?.username}
                </Text>
                {post.author?.bio && (
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {post.author.bio}
                  </Text>
                )}
              </div>
            </Group>
          </Group>
        </Paper>

        {/* Cover Image */}
        {post.coverImage && (
          <Image
            src={post.coverImage}
            alt={post.title}
            radius="md"
            maxHeight={400}
            fit="cover"
          />
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <Text size="lg" fs="italic" c="dimmed">
            {post.excerpt}
          </Text>
        )}

        <Divider my="sm" />

        {/* Main Content Container */}
        <Box
          style={{
            whiteSpace: "pre-line",
            lineHeight: 1.7,
            fontSize: "1.05rem",
          }}
        >
          {post.content}
        </Box>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <Group gap="xs" mt="xl">
            <Text size="sm" fw={500}>
              Tags:
            </Text>
            {post.tags.map((t) => (
              <Badge
                key={t.id}
                color="gray"
                variant="outline"
                component={Link}
                to={`/?tag=${t.slug}`}
                style={{ cursor: "pointer" }}
              >
                #{t.name}
              </Badge>
            ))}
          </Group>
        )}
      </Stack>
    </Container>
  );
}
