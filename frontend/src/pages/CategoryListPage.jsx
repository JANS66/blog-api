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
  Button,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import { getCategories } from "../api/categories";
import { useAuth } from "../context/useAuth";
import CreateCategoryModal from "../components/CreateCategoryModal";
import DeleteCategoryModal from "../components/DeleteCategoryModal";
import { IconTrash } from "@tabler/icons-react";

export default function CategoryListPage() {
  const { user } = useAuth();
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [order, setOrder] = useState("asc");

  const isAdmin = user?.role === "ADMIN";

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
      {/* Header with Mobile Stack and Desktop Group */}
      <Group justify="space-between" align="center" mb="xl">
        <Title order={2}>Categories</Title>

        <Group gap="xs" w={{ base: "100%", sm: "auto" }}>
          {isAdmin && (
            <Button onClick={() => setModalOpened(true)} size="sm">
              + Create Category
            </Button>
          )}
          <Select
            size="sm"
            style={{ flex: 1 }}
            w={{ base: "100%", sm: 200 }}
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
              {/* Top row inside card */}
              <Group
                justify="space-between"
                align="flex-start"
                wrap="nowrap"
                gap="sm"
              >
                <Box style={{ overflow: "hidden", minWidth: 0, flex: 1 }}>
                  <Text fw={600} size="lg" truncate="end">
                    {category.name}
                  </Text>
                  <Text size="xs" c="dimmed" truncate="end">
                    /{category.slug}
                  </Text>
                </Box>

                {/* Right side actions & badge */}
                <Group
                  gap={6}
                  align="center"
                  wrap="nowrap"
                  style={{ flexShrink: 0 }}
                >
                  <Badge color="blue" variant="light" size="md">
                    {category.postCount}{" "}
                    {category.postCount === 1 ? "post" : "posts"}
                  </Badge>
                  {isAdmin && (
                    <Tooltip label="Delete category">
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeletingCategory(category);
                        }}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <DeleteCategoryModal
        category={deletingCategory}
        opened={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
      />

      <CreateCategoryModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
      />
    </Container>
  );
}
