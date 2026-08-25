import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Container,
  Grid,
  Card,
  Image,
  Text,
  Badge,
  CloseButton,
  Group,
  Avatar,
  TextInput,
  Pagination,
  Skeleton,
  Alert,
  Stack,
  Title,
  Paper,
  Flex,
} from "@mantine/core";
import { getPosts } from "../api/posts";

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read current filter state from URL query parameters (defaults: page 1, limit 9)
  const page = Number(searchParams.get("page")) || 1;
  const category = searchParams.get("category") || "";
  const tag = searchParams.get("tag") || "";
  const searchParam = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(searchParam);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["posts", { page, category, tag, search: searchParam }],
    queryFn: () =>
      getPosts({
        page,
        limit: 9,
        ...(category && { category }),
        ...(tag && { tag }),
        ...(searchParam && { search: searchParam }),
      }),
    placeholderData: keepPreviousData,
  });

  // Helper to update URL params
  const updateFilters = (newParams) => {
    const current = Object.fromEntries(searchParams.entries());
    const updated = { ...current, ...newParams };

    // Clean up empty params
    Object.keys(updated).forEach((key) => {
      if (!updated[key]) delete updated[key];
    });

    setSearchParams(updated);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ search: searchInput, page: 1 });
  };

  const clearFilter = (key) => {
    if (key === "search") setSearchInput("");
    updateFilters({ [key]: "", page: 1 });
  };

  return (
    <Container size="lg" my={40}>
      {/* Search and Header Section */}
      <Stack mb={40} gap="md">
        <Title order={1} ta="center">
          Explore Blog Posts
        </Title>
        <Text c="dimmed" ta="center" size="lg">
          Discover insights, tutorials, and stories from our community.
        </Text>

        <form onSubmit={handleSearchSubmit}>
          <Group justify="center" mt="md">
            <TextInput
              placeholder="Search by title or content..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ width: "100%", maxWidth: 500 }}
            />
          </Group>
        </form>

        {/* Active Filters Badges */}
        {(category || tag || searchParam) && (
          <Group justify="center" gap="xs">
            {category && (
              <Badge
                color="blue"
                variant="filled"
                pr={3}
                rightSection={
                  <CloseButton
                    size={16}
                    color="white"
                    variant="transparent"
                    onClick={() => clearFilter("category")}
                  />
                }
              >
                Category: {category}
              </Badge>
            )}
            {tag && (
              <Badge
                color="cyan"
                variant="filled"
                pr={3}
                rightSection={
                  <CloseButton
                    size={16}
                    color="white"
                    variant="transparent"
                    onClick={() => clearFilter("tag")}
                  />
                }
              >
                Tag: {tag}
              </Badge>
            )}
            {searchParam && (
              <Badge
                color="gray"
                variant="filled"
                pr={3}
                rightSection={
                  <CloseButton
                    size={16}
                    color="white"
                    variant="transparent"
                    onClick={() => clearFilter("search")}
                  />
                }
              >
                Query: "{searchParam}"
              </Badge>
            )}
          </Group>
        )}
      </Stack>

      {/* Loading Skeleton */}
      {isLoading && (
        <Grid>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Grid.Col key={n} span={{ base: 12, sm: 6, md: 4 }}>
              <Card radius="md" withBorder p="lg">
                <Skeleton height={160} mb="sm" />
                <Skeleton height={20} width="80%" mb="xs" />
                <Skeleton height={14} width="100%" mb="xs" />
                <Skeleton height={14} width="60%" mb="md" />
                <Group>
                  <Skeleton height={30} circle />
                  <Skeleton height={14} width={100} />
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}

      {/* Error Message */}
      {isError && (
        <Alert color="red" title="Error">
          {error.response?.data?.error || "Failed to fetch posts."}
        </Alert>
      )}

      {/* Posts List */}
      {!isLoading && !isError && (
        <>
          {data?.posts?.length === 0 ? (
            <Paper p={40} radius="md" withBorder ta="center">
              <Text size="lg" c="dimmed">
                No published posts found.
              </Text>
            </Paper>
          ) : (
            <Grid align="stretch">
              {data?.posts?.map((post) => (
                <Grid.Col key={post.id} span={{ base: 12, sm: 6, md: 4 }}>
                  <Card
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    onClick={() => navigate(`/posts/${post.slug}`)}
                    style={{
                      cursor: "pointer",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {post.coverImage && (
                      <Card.Section mb="sm">
                        <Image
                          src={post.coverImage}
                          height={160}
                          alt={post.title}
                        />
                      </Card.Section>
                    )}

                    {/* Category Badge */}
                    {post.category && (
                      <Group mb="xs">
                        <Badge
                          color="blue"
                          variant="light"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevents navigating to post detail
                            updateFilters({
                              category: post.category.slug,
                              page: 1,
                            });
                          }}
                        >
                          {post.category.name}
                        </Badge>
                      </Group>
                    )}

                    <Text fw={600} size="lg" lineClamp={2} mb="xs">
                      {post.title}
                    </Text>

                    {post.excerpt && (
                      <Text size="sm" c="dimmed" lineClamp={3} mb="md">
                        {post.excerpt}
                      </Text>
                    )}

                    {/* Tags */}
                    {post.tags?.length > 0 && (
                      <Group gap={6} mb="md">
                        {post.tags.map((t) => (
                          <Badge
                            key={t.id}
                            size="xs"
                            color="gray"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevents navigating to post detail
                              updateFilters({ tag: t.slug, page: 1 });
                            }}
                          >
                            #{t.name}
                          </Badge>
                        ))}
                      </Group>
                    )}

                    {/* Card Footer: Author and Date */}
                    <Flex
                      justify="space-between"
                      align="center"
                      mt="auto"
                      pt="sm"
                    >
                      <Group gap="xs">
                        <Avatar
                          src={post.author?.avatarUrl}
                          size={28}
                          radius="xl"
                        >
                          {post.author?.username?.[0]?.toUpperCase()}
                        </Avatar>
                        <Text
                          size="xs"
                          fw={500}
                          onClick={(e) => {
                            e.stopPropagation(); // Stop card click
                            navigate(`/users/${post.author?.username}`); // Navigate to user profile
                          }}
                          style={{
                            cursor: "pointer",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          {post.author?.username}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </Text>
                    </Flex>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          )}

          {/* Pagination */}
          {data?.pagination?.totalPages > 1 && (
            <Group justify="center" mt="xl">
              <Pagination
                total={data.pagination.totalPages}
                value={page}
                onChange={(newPage) => updateFilters({ page: newPage })}
              />
            </Group>
          )}
        </>
      )}
    </Container>
  );
}
