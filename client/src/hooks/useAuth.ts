import { useQuery } from "@tanstack/react-query";
import { Employee } from "@/types";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<Employee>({
    queryKey: ["/api/admin/me"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    error,
  };
}
