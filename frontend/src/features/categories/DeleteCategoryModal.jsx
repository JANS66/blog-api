import { useState } from "react";
import { Modal, Text, Button, Group, Stack, Alert } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCategory } from "../../api/categories";

export default function DeleteCategoryModal({ item, opened, onClose }) {
  const [serverError, setServerError] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => deleteCategory(item.id),
    onSuccess: () => {
      // Refetch the categories list so the UI removes the category
      queryClient.invalidateQueries({ queryKey: ["categories"] });

      // Refetch posts so posts with 'categoryId = null' get fresh data
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setServerError("");
      onClose();
    },
    onError: (err) => {
      setServerError(err.response?.data?.error || "Failed to delete category.");
    },
  });

  const handleDelete = () => {
    setServerError("");
    mutation.mutate();
  };

  const handleClose = () => {
    setServerError("");
    onClose();
  };

  if (!item) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Delete Category"
      centered
    >
      <Stack gap="md">
        {serverError && (
          <Alert color="red" title="Error">
            {serverError}
          </Alert>
        )}
        <Text size="sm">
          Are you sure you want to delete category{" "}
          <strong>"{item.name}"</strong>? This action cannot be undone.
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
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
