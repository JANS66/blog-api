import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Container,
  Alert,
  Stack,
} from "@mantine/core";
import { loginSchema } from "../schemas/authSchema";
import { loginUser } from "../api/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      queryClient.setQueryData(["currentUser"], { user: data.user });
      navigate("/");
    },
    onError: (error) => {
      const message =
        error.response?.data?.error ||
        "Login failed. Please check your credentials.";
      setServerError(message);
    },
  });

  const onSubmit = (data) => {
    setServerError("");
    mutation.mutate(data);
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" order={2}>
        Welcome back
      </Title>
      <Text color="dimmed" size="sm" ta="center" mt={5}>
        Don't have an account yet? <Link to="/register">Register</Link>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {serverError && (
          <Alert color="red" mb="md">
            {serverError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing="md">
            <TextInput
              label="Email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              error={errors.password?.message}
              {...register("password")}
            />

            <Button type="submit" fullWidth loading={mutation.isPending}>
              Sign In
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
