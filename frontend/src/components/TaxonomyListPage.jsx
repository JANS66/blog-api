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
import { IconTrash, IconPencil, IconTag } from "@tabler/icons-react";
import { useAuth } from "../context/useAuth";

export default function TaxonomyListPage({
  title, // "Categories" or "Tags"
  queryKey, // ["categories"] or ["tags"]
  fetchFn, // getCategories or getTags
  dataKey, // "categories" or "tags"
  paramKey, // "category" or "tag"
  CreateModal,
  EditModal,
  DeleteModal,
  showTagIcon = false,
}) {
  const { user } = useAuth();
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [order, setOrder] = useState("asc");

  const isAdmin = user?.role === "ADMIN";

  // Single query for all items
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [queryKey],
    queryFn: fetchFn,
  });

  // Client side sorting for instant UX
  const items = useMemo(() => {
    const rawList = data?.[dataKey] || data || [];

    return [...rawList].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "posts") {
        comparison = (a.postCount || 0) - (b.postCount || 0);
      }
      return order === "desc" ? -comparison : comparison;
    });
  }, [data, dataKey, sortBy, order]);

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
          {error?.response?.data?.error ||
            `Failed to load ${title.toLowerCase()}.`}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" my={40}>
      {/* Responsive Header */}
      <Group justify="space-between" align="center" mb="xl">
        <Title order={2}>{title}</Title>

        <Group gap="xs" w={{ base: "100%", sm: "auto" }}>
          {isAdmin && CreateModal && (
            <Button onClick={() => setCreateModalOpened(true)} size="sm">
              + Create {title.slice(0, -1)}
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

      {/* Grid List */}
      {items.length === 0 ? (
        <Paper p="xl" radius="md" withBorder ta="center">
          <Text c="dimmed">No {title.toLowerCase()} available yet.</Text>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {items.map((item) => (
            <Card
              key={item.id}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              component={Link}
              to={`/?${paramKey}=${item.slug}`}
              style={{ textDecoration: "none", colo: "inherit" }}
            >
              <Group
                justify="space-between"
                align="flex-start"
                wrap="nowrap"
                gap="sm"
              >
                <Box style={{ overflow: "hidden", minWidth: 0, flex: 1 }}>
                  <Group gap={6} align="center" wrap="nowrap">
                    {showTagIcon && (
                      <IconTag
                        size={16}
                        style={{ opacity: 0.6, flexShrink: 0 }}
                      />
                    )}
                    <Text fw={600} size="lg" truncate="end">
                      {item.name}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed" truncate="end">
                    /{item.slug}
                  </Text>
                </Box>

                <Group
                  gap={6}
                  align="center"
                  wrap="nowrap"
                  style={{ flexShrink: 0 }}
                >
                  <Badge color="blue" variant="light" size="md">
                    {item.postCount || 0}{" "}
                    {item.postCount === 1 ? "post" : "posts"}
                  </Badge>

                  {isAdmin && (EditModal || DeleteModal) && (
                    <Group gap={4}>
                      {EditModal && (
                        <Tooltip
                          label={`Edit ${title.slice(0, -1).toLowerCase()}`}
                        >
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingItem(item);
                            }}
                          >
                            <IconPencil size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}

                      {DeleteModal && (
                        <Tooltip
                          label={`Delete ${title.slice(0, -1).toLowerCase()}`}
                        >
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeletingItem(item);
                            }}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  )}
                </Group>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Render Modals */}
      {EditModal && (
        <EditModal
          item={editingItem}
          opened={!!editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      {DeleteModal && (
        <DeleteModal
          item={deletingItem}
          opened={!!deletingItem}
          onClose={() => setDeletingItem(null)}
        />
      )}

      {CreateModal && (
        <CreateModal
          opened={createModalOpened}
          onClose={() => setCreateModalOpened(false)}
        />
      )}
    </Container>
  );
}
