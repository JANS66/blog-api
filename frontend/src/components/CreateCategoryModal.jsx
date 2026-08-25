import { useState } from "react";
import { Modal, TextInput, Button, Group, Stack, Alert } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { createCategory } from "../api/categories";
import { zodResolver } from "mantine-form-zod-resolver";

const schema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name cannot exceed 50 characters")
    .trim(),
});

export default function CreateCategoryModal({ opened, onClose }) {
  const [serverError, setServerError] = useState("");
  const queryClient = useQueryClient();

  const form = useForm({
    initialValues: {
      name: "",
    },
    validate: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      form.reset();
      setServerError("");
      onClose();
    },
    onError: (err) => {
      setServerError(err.response?.data?.error || "Failed to create category.");
    },
  });

  const handleSubmit = (values) => {
    setServerError("");
    mutation.mutate(values);
  };

  const handleClose = () => {
    form.reset();
    setServerError("");
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Create Category"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {serverError && (
            <Alert color="red" title="Error">
              {serverError}
            </Alert>
          )}

          <TextInput
            label="Category Name"
            placeholder="e.g. Cybersecuirty, Web Dev"
            required
            {...form.getInputProps("name")}
          />

          <Group justify="end" mt="md">
            <Button
              variant="default"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
