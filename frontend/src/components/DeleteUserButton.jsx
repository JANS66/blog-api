import { useState } from "react";
import { Button, Modal, Text, Group, Alert } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUser } from "../api/users";

export default function DeleteUserButton({ userId, username, onSuccess }) {
  const [opened, setOpened] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => deleteUser(userId),
    onSuccess: () => {
      setOpened(false);
      queryClient.invalidateQueries({ queryKey: ["userProfile", username] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      const msg = error.response?.data?.error || "Failed to delete user.";
      setErrorMessage(msg);
    },
  });

  return (
    <>
      <Button color="red" variant="light" onClick={() => setOpened(true)}>
        Delete Account
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Confirm User Deletion"
        centered
      >
        {errorMessage && (
          <Alert color="red" mb="md">
            {errorMessage}
          </Alert>
        )}

        <Text size="sm" mb="lg">
          Are you sure you want to hard delete the account for <b>{username}</b>
          ? This action cannot be undone and will permanently remove all their
          associated data.
        </Text>

        <Group justify="flex-end">
          <Button variant="default" onClick={() => setOpened(false)}>
            Cancel
          </Button>
          <Button
            color="red"
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Confirm Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
}
