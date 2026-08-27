import { useState } from "react";
import { Modal, Text, Button, Group, Stack, Alert } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTag } from "../api/tags";

export default function DeleteTagModal({ item, opened, onClose }) {
  const [serverError, setServerError] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setServerError("");
      onClose();
    },
    onError: (err) => {
      setServerError(err.response?.data?.error || "Failed to delete tag.");
    },
  });

  const handleDelete = () => {
    if (!item) return;
    setServerError("");
    mutation.mutate(item.id);
  };

  const handleClose = () => {
    setServerError("");
    onClose();
  };

  if (!item) return null;

  return (
    <Modal opened={opened} onClose={handleClose} title="Delete Tag" centered>
      <Stack gap="md">
        {serverError && (
          <Alert color="red" title="Error">
            {serverError}
          </Alert>
        )}

        <Text size="sm">
          Are you sure you want to delete the tag{" "}
          <Text span fw={700}>
            "{item.name}"
          </Text>
          ? This action cannot be undone.
        </Text>

        <Group justify="end" mt="md">
          <Button
            variant="default"
            onClick={handleClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            color="red"
            onClick={handleDelete}
            loading={mutation.isPending}
          >
            Delete Tag
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
