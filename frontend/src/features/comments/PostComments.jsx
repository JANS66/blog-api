import { useState } from "react";
import {
  Stack,
  Group,
  Avatar,
  Text,
  Paper,
  Title,
  Pagination,
  Loader,
  Alert,
  Badge,
} from "@mantine/core";
import { IconAlertCircle, IconMessageCircle } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { getCommentsByPost } from "../../api/comments";

export default function PostComments({ postId }) {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["comments", postId, { page, limit }],
    queryFn: () => getCommentsByPost(postId, { page, limit }),
    enabled: !!postId,
  });

  const comments = data?.comments || [];
  const pagination = data?.pagination || { totalPages: 1, totalComments: 0 };

  return (
    <Stack gap="lg" mt={40}>
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <IconMessageCircle size={22} />
          <Title order={3}>Comments</Title>
          <Badge variant="light" size="lg">
            {pagination.totalComments}
          </Badge>
        </Group>
      </Group>

      {/* Loading State */}
      {isLoading && (
        <Group justify="center" my="xl">
          <Loader size="md" />
        </Group>
      )}

      {/* Error State */}
      {isError && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
          {error?.response?.data?.error || "Failed to load comments."}
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !isError && comments.length === 0 && (
        <Text c="dimmed" ta="center" my="xl">
          No comments yet. Be the first to start the conversation!
        </Text>
      )}

      {/* Comments List */}
      {!isLoading && !isError && comments.length > 0 && (
        <Stack gap="md">
          {comments.map((comment) => (
            <Paper key={comment.id} p="md" radius="md" withBorder>
              <Group align="flex-start" wrap="nowrap">
                <Avatar
                  src={comment.author?.avatarUrl}
                  alt={comment.author?.username}
                  radius="xl"
                  color="blue"
                >
                  {comment.author?.username?.slice(0, 2).toUpperCase()}
                </Avatar>

                <Stack gap={4} style={{ flex: 1 }}>
                  <Group justify="space-between" align="center">
                    <Text fw={600} size="sm">
                      {comment.author?.username || "Anonymous"}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {new Date(comment.createdAt).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </Text>
                  </Group>

                  <Text size="sm" style={{ whiteSpace: "pre-line" }}>
                    {comment.content}
                  </Text>
                </Stack>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <Group justify="center" mt="md">
          <Pagination
            value={page}
            onChange={setPage}
            total={pagination.totalPages}
            color="blue"
          />
        </Group>
      )}
    </Stack>
  );
}
