import { useEffect, useState } from "react";
import { Modal, TextInput, Button, Group, Stack, Alert } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCategory } from "../api/categories";

export default function EditCategoryModal({ category, opened, onClose }) {
  const [serverError, setServerError] = useState("");
  const queryClient = useQueryClient();

  const form = useForm({
    initialValues: {
      name: "",
    },
    validate: {
      name: (val) => {
        const trimmed = val.trim();
        if (trimmed.length < 2)
          return "Category name must be at least 2 characters";
        if (trimmed.length > 50)
          return "Category name cannot exceed 50 characters";
        return null;
      },
    },
  });

  // Populate form with category data when modal opens
  useEffect(() => {
    if (category) {
      form.setValues({ name: category.name });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category?.id]); // Triggers ONLY when a different category is selected

  const mutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      form.reset();
      setServerError("");
      onClose();
    },
    onError: (err) => {
      setServerError(err.response?.data?.error || "Failed to update category.");
    },
  });

  const handleSubmit = (values) => {
    setServerError("");
    mutation.mutate({
      id: category.id,
      name: values.name.trim(),
    });
  };

  const handleClose = () => {
    form.reset();
    setServerError("");
    onClose();
  };

  if (!category) return null;

  return (
    <Modal opened={opened} onClose={handleClose} title="Edit Category" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {serverError && (
            <Alert color="red" title="Error">
              {serverError}
            </Alert>
          )}

          <TextInput
            label="Category Name"
            placeholder="e.g. Cybersecurity"
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
              Save Changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
