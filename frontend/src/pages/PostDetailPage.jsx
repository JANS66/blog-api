import { useParams, Link, useNavigate } from "react-router-dom";
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
  Button,
  Typography,
} from "@mantine/core";
import { getPostBySlug } from "../api/posts";
import { useAuth } from "../context/useAuth";
import DeletePostButton from "../features/posts/DeletePostButton";
import PostComments from "../features/comments/PostComments";

export default function PostDetailPage() {
  const { user } = useAuth();
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["post", slug],
    queryFn: () => getPostBySlug(slug),
    enabled: Boolean(slug), // Prevents fetch if slug is missing/undefined
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

  const isOwnerOrAdmin =
    user && (user.id === post?.author?.id || user.role === "ADMIN");
  return (
    <Container size="md" my={40}>
      <Stack gap="lg">
        {/* Top Header Toolbar */}
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          {/* Left: Category & Status Badges */}
          <Group gap="xs" align="center">
            {post.category && (
              <Badge
                color="blue"
                variant="light"
                size="lg"
                radius="sm"
                component={Link}
                to={`/?category=${post.category.slug}`}
                style={{ cursor: "pointer" }}
              >
                {post.category.name}
              </Badge>
            )}

            {post.status === "DRAFT" && (
              <Badge color="yellow" variant="filled" size="lg" radius="sm">
                DRAFT (Private)
              </Badge>
            )}
          </Group>

          {/* Right: Metrics & Owner Actions */}
          <Group gap="md" align="center">
            <Text size="xs" c="dimmed" fw={500}>
              {post.viewsCount} {post.viewsCount === 1 ? "view" : "views"}
            </Text>

            {isOwnerOrAdmin && (
              <Group
                gap="xs"
                style={{
                  borderLeft: "1px solid var(--mantine-color-gray-3)",
                  paddingLeft: 12,
                }}
              >
                <Button
                  component={Link}
                  to={`/posts/${post.slug}/edit`}
                  variant="subtle"
                  color="gray"
                  size="xs"
                >
                  Edit
                </Button>

                <DeletePostButton
                  postId={post.id}
                  postTitle={post.title}
                  onSuccess={() =>
                    navigate(`/users/${user.username}`, {
                      state: { message: "Post deleted successfully." },
                    })
                  }
                />
              </Group>
            )}
          </Group>
        </Group>

        {/* Title */}
        <Title
          order={1}
          style={{
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        >
          {post.title}
        </Title>

        {/* Author Details */}
        <Paper p="sm" radius="md" withBorder>
          <Group justify="space-between">
            <Group gap="sm">
              <Avatar src={post.author?.avatarUrl} radius="xl" size="md">
                {post.author?.username?.[0]?.toUpperCase()}
              </Avatar>
              <div>
                {post.author ? (
                  <Text
                    fw={600}
                    size="sm"
                    component={Link}
                    to={`/users/${post.author.username}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {post.author.username}
                  </Text>
                ) : (
                  <Text fw={600} size="sm" c="dimmed">
                    Deleted User
                  </Text>
                )}

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
            mah={400}
            fit="cover"
          />
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <Text
            size="lg"
            fs="italic"
            c="dimmed"
            style={{
              whiteSpace: "pre-line",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            {post.excerpt}
          </Text>
        )}

        <Divider my="sm" />

        {/* Main Content Container */}
        <Typography>
          <Box
            dangerouslySetInnerHTML={{ __html: post.content }}
            className="post-content"
            style={{
              whiteSpace: "pre-line",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          />
        </Typography>

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

      <PostComments postId={post.id} />
    </Container>
  );
}
