import { useState } from "react";
import { Link } from "react-router-dom";
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
  Button,
  Box,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconMessageCircle,
  IconCornerDownRight,
  IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCommentsByPost, deleteComment } from "../../api/comments";
import { useAuth } from "../../context/useAuth";
import CreateCommentForm from "./CreateCommentForm";
import { modals } from "@mantine/modals";

export default function PostComments({ postId }) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const queryClient = useQueryClient();
  const limit = 20;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["comments", postId, { page, limit }],
    queryFn: () => getCommentsByPost(postId, { page, limit }),
    enabled: !!postId,
  });

  const comments = data?.comments || [];
  const pagination = data?.pagination || { totalPages: 1, totalComments: 0 };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (commentId) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });

  const openDeleteModal = (commentId) =>
    modals.openConfirmModal({
      title: "Delete comment",
      children: (
        <Text size="sm">
          Are you sure you want to delete this comment? This action cannnot be
          undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => deleteMutation.mutate(commentId),
    });

  // Helper function to build a nested tree from a flat comment list
  const buildCommentTree = (flatComments) => {
    const commentMap = {};
    const rootComments = [];

    // Initialize map with replies array on each comment
    flatComments.forEach((comment) => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    flatComments.forEach((comment) => {
      if (comment.parentId && commentMap[comment.parentId]) {
        // Push this comment into its parents replies array
        commentMap[comment.parentId].replies.push(commentMap[comment.id]);
      } else {
        // Top level comment
        rootComments.push(commentMap[comment.id]);
      }
    });

    return rootComments;
  };

  const commentTree = buildCommentTree(comments);

  // Reusable comment renderer component for recursive nesting support
  const CommentItem = ({ comment, isReply = false }) => {
    const canDelete =
      user && (user.id === comment.author?.id || user.role === "ADMIN");

    return (
      <Paper
        p="md"
        radius="md"
        withBorder
        style={
          isReply
            ? {
                marginLeft: "32px",
                borderLeft: "3px solid var(--mantine-color-blue-filled)",
                backgroundColor: "var(--mantine-color-default-hover)",
              }
            : undefined
        }
      >
        <Group align="flex-start" wrap="nowrap">
          {comment.author?.id && (
            <Link
              to={`/users/${comment.author.username}`}
              style={{ textDecoration: "none", display: "inline-block" }}
            >
              <Avatar
                src={comment.author?.avatarUrl}
                alt={comment.author?.username}
                radius="xl"
                color="blue"
                style={{ cursor: "pointer" }}
              >
                {comment.author?.username?.slice(0, 2).toUpperCase()}
              </Avatar>
            </Link>
          )}

          <Stack gap={4} style={{ flex: 1 }}>
            <Group justify="space-between" align="center">
              <Group gap="xs">
                {comment.author?.id && (
                  <Text
                    component={Link}
                    to={`/users/${comment.author.username}`}
                    fw={600}
                    size="sm"
                    c="var(--mantine-color-text)"
                    style={{
                      cursor: "pointer",
                      textDecoration: "none",
                    }}
                    className="hover-underline"
                  >
                    {comment.author?.username || "Anonymous"}
                  </Text>
                )}
                {canDelete && (
                  <Tooltip label="Delete comment">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={() => openDeleteModal(comment.id)}
                      loading={deleteMutation.isPending}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
              <Text size="xs" c="dimmed">
                {new Date(comment.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </Group>

            <Text size="sm" style={{ whiteSpace: "pre-line" }} mt={4}>
              {comment.content}
            </Text>

            {/* Reply Button */}
            {user && (
              <Group justify="flex-end" mt="xs">
                <Button
                  variant="subtle"
                  size="compact-xs"
                  leftSection={<IconCornerDownRight size={14} />}
                  onClick={() =>
                    setActiveReplyId(
                      activeReplyId === comment.id ? null : comment.id,
                    )
                  }
                >
                  {activeReplyId === comment.id ? "Cancel Reply" : "Reply"}
                </Button>
              </Group>
            )}

            {/* Inline Reply Form */}
            {activeReplyId === comment.id && (
              <Box mt="sm" pl="md">
                <CreateCommentForm
                  postId={postId}
                  parentId={comment.id}
                  onCancel={() => setActiveReplyId(null)}
                  onSuccessCallback={() => setActiveReplyId(null)}
                />
              </Box>
            )}
          </Stack>
        </Group>

        {/* Render Nested Replies Directly Below */}
        {comment.replies && comment.replies.length > 0 && (
          <Stack gap="md" mt="md">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply={true} />
            ))}
          </Stack>
        )}
      </Paper>
    );
  };

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

      {/* Main Comment Creation Box */}
      <CreateCommentForm postId={postId} />

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

      {/* Hierarchical Comments List */}
      {!isLoading && !isError && commentTree.length > 0 && (
        <Stack gap="md">
          {commentTree.map((comment) => (
            <CommentItem key={comment.id} comment={comment} isReply={false} />
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
