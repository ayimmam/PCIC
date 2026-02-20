import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";

export function useDecisions(filters = {}) {
  return useQuery({
    queryKey: ["decisions", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category) params.set("category", filters.category);
      if (filters.status) params.set("status", filters.status);
      const { data } = await api.get(`/decisions?${params}`);
      return data;
    },
  });
}

export function useCreateDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (decisionData) => {
      const { data } = await api.post("/decisions", decisionData);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["decisions"] }),
  });
}

export function useUpdateDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...decisionData }) => {
      const { data } = await api.put(`/decisions/${id}`, decisionData);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["decisions"] }),
  });
}
