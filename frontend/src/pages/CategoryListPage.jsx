import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Container,
  Paper,
  Title,
  Text,
  Badge,
  Group,
  SimpleGrid,
  Select,
  Skeleton,
  Alert,
  Card,
  Box,
} from "@mantine/core";
import { getCategories } from "../api/categories";

export default function CategoryListPage() {
  const [sortBy, setSortBy] = useState("name");
  const [order, setOrder] = useState("asc");

  // Fetch ALL categories once under a static queryKey
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 10, // Keep fresh for 10 minutes
  });

  // Sort in memory whenever sortBy or order state changes
  const categories = useMemo(() => {
    const rawList = data?.categories || [];

    return [...rawList].sort((a, b) => {
      let comparison = 0;

      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "posts") {
        comparison = (a.postCount || 0) - (b.postCount || 0);
      }

      return order === "desc" ? -comparison : comparison;
    });
  }, [data, sortBy, order]);

  if (isLoading) {
    return (
      <Container size="lg" my={40}>
        <Skeleton height={40} width={200} mb="lg" />
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={100} radius="md" />
          ))}
        </SimpleGrid>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container size="md" my={40}>
        <Alert color="red" title="Error">
          {error.response?.data?.error || "Failed to load categories."}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" my={40}>
      <Group justify="space-between" align="center" mb="xl">
        <Title order={2}>Categories</Title>

        <Select
          size="sm"
          w={{ base: "100%", sm: 220 }} // Full width on mobile, 220px on desktop
          value={`${sortBy}-${order}`}
          onChange={(val) => {
            if (!val) return;
            const [newSortBy, newOrder] = val.split("-");
            setSortBy(newSortBy);
            setOrder(newOrder);
          }}
          data={[
            { label: "Name (A to Z)", value: "name-asc" },
            { label: "Name (Z to A)", value: "name-desc" },
            { label: "Most Posts", value: "posts-desc" },
            { label: "Least Posts", value: "posts-asc" },
          ]}
        />
      </Group>

      {categories.length === 0 ? (
        <Paper p="xl" radius="md" withBorder ta="center">
          <Text c="dimmed">No categories available yet.</Text>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {categories.map((category) => (
            <Card
              key={category.id}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              component={Link}
              to={`/?category=${category.slug}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Group justify="space-between" align="center">
                <Box>
                  <Text fw={600} size="lg">
                    {category.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    /{category.slug}
                  </Text>
                </Box>
                <Badge color="blue" variant="light" size="lg">
                  {category.postCount}{" "}
                  {category.postCount === 1 ? "post" : "posts"}
                </Badge>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}
