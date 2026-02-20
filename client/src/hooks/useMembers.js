import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";

export function useMembers(filters = {}) {
  return useQuery({
    queryKey: ["members", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.domain) params.set("domain", filters.domain);
      if (filters.batch) params.set("batch", filters.batch);
      if (filters.status) params.set("status", filters.status);
      if (filters.search) params.set("search", filters.search);
      const { data } = await api.get(`/members?${params}`);
      return data;
    },
  });
}

export function useMemberCount() {
  return useQuery({
    queryKey: ["members", "count"],
    queryFn: async () => {
      const { data } = await api.get("/members/count");
      return data;
    },
  });
}

export function useUpdateMemberStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.put(`/members/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
    },
  });
}
