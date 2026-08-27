import { useState } from "react";
import { Button, Modal, Text, Group, Stack } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePost } from "../../api/posts";

export default function DeletePostButton({
  postId,
  postTitle,
  onSuccess,
  variant = "light",
  color = "red",
  size = "xs",
}) {
  const [opened, setOpened] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      setOpened(false);
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.error || "Failed to delete post.");
    },
  });

  return (
    <>
      <Button
        variant={variant}
        color={color}
        size={size}
        onClick={() => setOpened(true)}
      >
        Delete Post
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Confirm Post Deletion"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete{" "}
            <Text component="span" fw={700}>
              "{postTitle}"
            </Text>
            ? This action cannot be undone.
          </Text>

          {errorMsg && (
            <Text color="red" size="sm">
              {errorMsg}
            </Text>
          )}

          <Group justify="end">
            <Button
              variant="default"
              onClick={() => setOpened(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              color="red"
              loading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
