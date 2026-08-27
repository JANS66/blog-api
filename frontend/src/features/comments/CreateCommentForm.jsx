import { useState } from "react";
import { Textarea, Button, Group, Stack, Alert } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment } from "../../api/comments";
import { useAuth } from "../../context/useAuth";

export default function CreateCommentForm({
  postId,
  parentId = null,
  onCancel,
  onSuccessCallback,
}) {
  const { user } = useAuth();
  const [serverError, setServerError] = useState("");
  const queryClient = useQueryClient();

  const form = useForm({
    initialValues: {
      content: "",
    },
    validate: {
      content: (val) => {
        const trimmed = val.trim();
        if (!trimmed) return "Comment cannot be empty";
        if (trimmed.length > 1000)
          return "Comment cannot exceed 1000 characters";
        return null;
      },
    },
  });

  const mutation = useMutation({
    mutationFn: (values) =>
      createComment({
        postId,
        content: values.content.trim(),
        parentId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      form.reset();
      setServerError("");
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err) => {
      setServerError(err.response?.data?.error || "Failed to post comment.");
    },
  });

  const handleSubmit = (values) => {
    setServerError("");
    mutation.mutate(values);
  };

  if (!user) {
    return (
      <Alert color="blue" variant="light">
        Please log in to leave a comment.
      </Alert>
    );
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="sm">
        {serverError && (
          <Alert color="red" title="Error">
            {serverError}
          </Alert>
        )}

        <Textarea
          placeholder={
            parentId ? "Write a reply..." : "What are your thoughts?"
          }
          minRows={3}
          autosize
          required
          {...form.getInputProps("content")}
        />

        <Group justify="end" gap="xs">
          {onCancel && (
            <Button
              variant="default"
              size="xs"
              onClick={onCancel}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" size="xs" loading={mutation.isPending}>
            {parentId ? "Post Reply" : "Post Comment"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
