import { useQuery } from "@tanstack/react-query";
import { getMe } from "../api/users";
import { AuthContext } from "./AuthContextInstance";

export function AuthProvider({ children }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getMe,
    retry: false, // Dont retry if 401/403 (unauthenticated)
    staleTime: 1000 * 60 * 10, // Cache user profile for 10 minutes
  });

  const user = data?.user || null;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated, isError, refetchMe: refetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}
