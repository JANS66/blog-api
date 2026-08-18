import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
import { registerSchema } from "../schemas/authSchema";
import { registerUser } from "../api/auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      // User registered and cookie set by backend
      navigate("/");
    },
    onError: (error) => {
      const message =
        error.response?.data?.error || "Registration failed. Please try again.";
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
        Create an Account
      </Title>
      <Text color="dimmed" size="sm" ta="center" mt={5}>
        Already have an account? <Link to="/login">Sign in</Link>
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

            <TextInput
              label="Username"
              placeholder="johndoe"
              error={errors.username?.message}
              {...register("username")}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              error={errors.password?.message}
              {...register("password")}
            />

            <Button type="submit" fullWidth loading={mutation.isPending}>
              Register
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
