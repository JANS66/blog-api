import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Skeleton,
} from "@mantine/core";
import { updatePostSchema } from "../schemas/postSchema";
import { getPostBySlug, updatePost } from "../api/posts";
import { getCategories } from "../api/categories";
import { useAuth } from "../context/useAuth";
import { RichEditor } from "../features/posts/RichTextEditor";

export default function EditPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [serverError, setServerError] = useState("");
  const [coverImage, setCoverImage] = useState(null);

  // Generate URL for rendering, and clean up previous URLs when coverImage changes
  const previewUrl = coverImage ? URL.createObjectURL(coverImage) : null;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Fetch Post Details
  const {
    data: postData,
    isLoading: isPostLoading,
    isError: isPostError,
    error: postError,
  } = useQuery({
    queryKey: ["post", slug],
    queryFn: () => getPostBySlug(slug),
    enabled: Boolean(slug),
  });

  // Fetch Categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // Form Setup
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updatePostSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      status: "DRAFT",
      categoryId: "",
      tags: [],
    },
  });

  // Extract post object
  const post = postData?.post;

  // Hydrate form state once post data is loaded
  useEffect(() => {
    if (post) {
      reset({
        title: post.title || "",
        content: post.content || "",
        excerpt: post.excerpt || "",
        status: post.status || "DRAFT",
        categoryId: post.category?.id ? String(post.category.id) : "",
        tags: post.tags ? post.tags.map((t) => t.name) : [],
      });
    }
  }, [post, reset]);

  // Mutation
  const mutation = useMutation({
    mutationFn: updatePost,
    onSuccess: (data) => {
      const updatedPost = data.post;

      // Invalidate relevant query caches across the application
      queryClient.invalidateQueries({ queryKey: ["post", slug] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });

      if (updatedPost.status === "DRAFT") {
        navigate(`/users/${user?.username}`, {
          state: { message: "Post status set to Draft." },
        });
      } else {
        navigate(`/posts/${updatedPost.slug}`);
      }
    },
    onError: (err) => {
      setServerError(err.response?.data?.error || "Failed to update post.");
    },
  });

  if (isPostLoading) {
    return (
      <Container size="md" my={40}>
        <Skeleton height={40} mb="lg" />
        <Skeleton height={50} mb="md" />
        <Skeleton height={200} mb="md" />
      </Container>
    );
  }

  // Handle fetch errors or missing post data SECOND.
  if (isPostError || !post) {
    return (
      <Container size="md" my={40}>
        <Alert color="red" title="Error">
          {postError?.response?.data?.error || "Post not found."}
        </Alert>
      </Container>
    );
  }
  // Authorization Check
  const isOwnerOrAdmin =
    user && (user.id === post?.author.id || user.role === "ADMIN");

  if (!isOwnerOrAdmin) {
    return <Navigate to={`/posts/${slug}`} replace />;
  }

  const onSubmit = (data) => {
    setServerError("");

    const formData = new FormData();

    if (data.title && data.title !== post.title) {
      formData.append("title", data.title.trim());
    }

    if (data.content && data.content !== post.content) {
      formData.append("content", data.content.trim());
    }

    if (data.excerpt !== undefined && data.excerpt !== post.excerpt) {
      formData.append("excerpt", data.excerpt.trim());
    }

    if (data.status && data.status !== post.status) {
      formData.append("status", data.status);
    }

    const currentCatId = post.categoryId ? String(post.categoryId) : "";
    if (data.categoryId !== currentCatId) {
      formData.append("categoryId", data.categoryId || "");
    }

    // Only append tags if they differ from the original post tags
    const originalTags = post.tags ? post.tags.map((t) => t.name).sort() : [];
    const currentTags = Array.isArray(data.tags) ? [...data.tags].sort() : [];

    if (JSON.stringify(originalTags) !== JSON.stringify(currentTags)) {
      formData.append("tags", JSON.stringify(data.tags));
    }

    if (coverImage) {
      formData.append("coverImage", coverImage);
    }

    // Short circuit check matching backend logic
    if (
      !formData.has("title") &&
      !formData.has("content") &&
      !formData.has("excerpt") &&
      !formData.has("status") &&
      !formData.has("categoryId") &&
      !formData.has("tags") &&
      !formData.has("coverImage")
    ) {
      setServerError("Please modify at least one field before saving.");
      return;
    }

    mutation.mutate({ id: post.id, formData });
  };

  const categoriesList = Array.isArray(categoriesData)
    ? categoriesData
    : categoriesData?.categories || [];

  const categoryOptions = categoriesList.map((cat) => ({
    value: String(cat.id),
    label: cat.name,
  }));

  // Extract error message whether its on the array root or an individual item
  const tagErrorMessage =
    errors.tags?.message ||
    (Array.isArray(errors.tags)
      ? errors.tags.find((err) => err?.message)?.message
      : undefined);

  return (
    <Container size="md" my={40}>
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} mb="lg">
          Edit Post
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
                      { label: "Draft", value: "DRAFT" },
                      { label: "Published", value: "PUBLISHED" },
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
                  searchable
                  clearable
                  nothingFoundMessage="No categories found"
                  error={errors.categoryId?.message}
                />
              )}
            />

            {/* Tags Input */}
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <TagsInput
                  {...field}
                  label="Tags"
                  placeholder="Type tag and press Enter"
                  error={tagErrorMessage}
                />
              )}
            />

            {/* Cover Image */}
            <FileInput
              label="Change Cover Image"
              placeholder="Choose new image file"
              accept="image/*"
              value={coverImage}
              onChange={setCoverImage}
              clearable
            />

            {/* Image Preview: show new selection or existing image */}
            {(previewUrl || post.coverImage) && (
              <Box my="xs">
                <Text size="xs" c="dimmed" mb={4}>
                  {previewUrl ? "New Cover Preview:" : "Current Cover:"}
                </Text>
                <Image
                  src={previewUrl || post.coverImage}
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
            <Controller
              name="content"
              control={control}
              render={({ field, fieldState }) => (
                <RichEditor
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  label="Content"
                  required
                />
              )}
            />

            {/* Action Buttons */}
            <Group justify="end" mt="md">
              <Button
                variant="subtle"
                color="gray"
                onClick={() => navigate(`/posts/${slug}`)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                Save Changes
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
