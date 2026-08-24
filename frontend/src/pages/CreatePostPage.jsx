import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Container,
  Paper,
  Title,
  TextInput,
  Textarea,
  Select,
  TagsInput,
  FileInput,
  Button,
  Group,
  Stack,
  Alert,
  SegmentedControl,
  Text,
  Image,
  Box,
} from "@mantine/core";
import { createPostSchema } from "../schemas/postSchema";
import { createPost } from "../api/posts";
import { getCategories } from "../api/categories";
import { useAuth } from "../context/useAuth";

export default function CreatePostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [coverImage, setCoverImage] = useState(null);

  // Fetch Categories for dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    refetchOnWindowFocus: false, // Disables refetching when changing browser tabs
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      status: "DRAFT",
      categoryId: "",
      tags: [],
    },
  });

  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: (data) => {
      const createdPost = data.post;

      if (createdPost.status === "DRAFT") {
        navigate(`/users/${user?.username}`, {
          state: { message: "Draft saved successfully!" },
        });
      } else {
        navigate(`/posts/${createdPost.slug}`);
      }
    },
    onError: (err) => {
      setServerError(err.response?.data?.error || "Failed to create post.");
    },
  });

  const onSubmit = (data) => {
    setServerError("");

    const formData = new FormData();
    formData.append("title", data.title.trim());
    formData.append("content", data.content.trim());
    formData.append("status", data.status);

    if (data.excerpt?.trim()) {
      formData.append("excerpt", data.excerpt.trim());
    }

    if (data.categoryId) {
      formData.append("categoryId", data.categoryId);
    }

    if (data.tags && data.tags.length > 0) {
      formData.append("tags", JSON.stringify(data.tags));
    }

    if (coverImage) {
      formData.append("coverImage", coverImage);
    }

    mutation.mutate(formData);
  };

  const categoriesList = Array.isArray(categoriesData)
    ? categoriesData
    : categoriesData?.categories || [];

  const categoryOptions = categoriesList.map((cat) => ({
    value: String(cat.id),
    label: cat.name,
  }));

  return (
    <Container size="md" my={40}>
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} mb="lg">
          Create New Post
        </Title>

        {serverError && (
          <Alert
            color="red"
            mb="lg"
            onClose={() => setServerError("")}
            withCloseButton
          >
            {serverError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="md">
            {/* Status Switcher */}
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <div>
                  <Text size="sm" fw={500} mb={5}>
                    Post Status
                  </Text>
                  <SegmentedControl
                    {...field}
                    data={[
                      { label: "Save as Draft", value: "DRAFT" },
                      { label: "Publish Immediately", value: "PUBLISHED" },
                    ]}
                  />
                </div>
              )}
            />

            {/* Title */}
            <TextInput
              label="Title"
              placeholder="Enter post title"
              required
              error={errors.title?.message}
              {...register("title")}
            />

            {/* Category Select */}
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  label="Category"
                  placeholder="Select category (optional)"
                  data={categoryOptions}
                  error={errors.categoryId?.message}
                />
              )}
            />

            {/* Tags Input  */}
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <TagsInput
                  {...field}
                  label="Tags"
                  placeholder="Type tag and press Enter"
                  error={errors.tags?.message}
                  clearable
                />
              )}
            />

            {/* Cover Image */}
            <FileInput
              label="Cover Image"
              placeholder="Choose image file"
              accept="image/*"
              value={coverImage}
              onChange={setCoverImage}
              clearable
            />

            {coverImage && (
              <Box my="xs">
                <Text size="xs" c="dimmed" mb={4}>
                  Cover Preview:
                </Text>
                <Image
                  src={URL.createObjectURL(coverImage)}
                  alt="Cover Preview"
                  mah={200}
                  radius="md"
                  fit="cover"
                />
              </Box>
            )}

            {/* Excerpt */}
            <Textarea
              label="Excerpt"
              placeholder="Brief summary of the post (optional)"
              autosize
              minRows={3}
              maxRows={6}
              maxLength={300}
              error={errors.excerpt?.message}
              {...register("excerpt")}
            />

            {/* Content */}
            <Textarea
              label="Content"
              placeholder="Write your post content here..."
              required
              autosize
              minRows={15}
              maxRows={30}
              error={errors.content?.message}
              {...register("content")}
            />

            {/* Action Buttons */}
            <Group justify="end" mt="md">
              <Button
                variant="subtle"
                color="gray"
                onClick={() => navigate("/")}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" loading={mutation.isPending}>
                Save Post
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
