import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Container,
  Paper,
  Title,
  TextInput,
  Textarea,
  FileInput,
  Button,
  Avatar,
  Group,
  Stack,
  Alert,
} from "@mantine/core";
import { useAuth } from "../context/useAuth";
import { updateProfileSchema } from "../schemas/userSchema";
import { updateMe } from "../api/users";

export default function EditProfilePage() {
  const { user, refetchMe } = useAuth();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: user?.username || "",
      bio: user?.bio || "",
    },
  });

  const mutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (data) => {
      setSuccessMsg("Profile updated successfully!");
      // Refresh current user state across AuthContext and React Query cache
      queryClient.setQueryData(["currentUser"], { user: data.user });
      refetchMe();
    },
    onError: (error) => {
      const message =
        error.response?.data?.error || "Failed to update profile.";
      setServerError(message);
    },
  });

  const onSubmit = (data) => {
    setServerError("");
    setSuccessMsg("");

    const formData = new FormData();
    if (data.username && data.username !== user?.username) {
      formData.append("username", data.username);
    }

    if (data.bio !== undefined && data.bio !== user?.bio) {
      formData.append("bio", data.bio);
    }

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    // Dont send empty requests
    if (
      !formData.has("username") &&
      !formData.has("bio") &&
      !formData.has("avatar")
    ) {
      setServerError("Please change at least one field before saving.");
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <Container size={500} my={40}>
      <Title order={2} ta="center" mb="lg">
        Edit Profile
      </Title>

      <Paper withBorder shadow="md" p={30} radius="md">
        {serverError && (
          <Alert color="red" mb="md">
            {serverError}
          </Alert>
        )}
        {successMsg && (
          <Alert color="green" mb="md">
            {successMsg}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing="md">
            <Group justify="center" mb="sm">
              <Avatar
                src={
                  avatarFile ? URL.createObjectURL(avatarFile) : user?.avatarUrl
                }
                size={90}
                radius="xl"
              />
            </Group>

            <FileInput
              label="Avatar Image"
              placeholder="Upload new avatar"
              accept="image/png,image/jpeg,image/webp"
              onChange={setAvatarFile}
              clearable
            />

            <TextInput
              label="Username"
              placeholder="Username"
              error={errors.username?.message}
              {...register("username")}
            />

            <Textarea
              label="Bio"
              placeholder="Tell us about yourself..."
              rows={4}
              error={errors.bio?.message}
              {...register("bio")}
            />

            <Button type="submit" fullWidth loading={mutation.isPending}>
              Save Changes
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
