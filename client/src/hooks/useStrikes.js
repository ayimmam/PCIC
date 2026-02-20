import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";

export function useStrikes() {
  return useQuery({
    queryKey: ["strikes"],
    queryFn: async () => {
      const { data } = await api.get("/strikes");
      return data;
    },
  });
}

export function useMemberStrikes(memberId) {
  return useQuery({
    queryKey: ["strikes", "member", memberId],
    queryFn: async () => {
      const { data } = await api.get(`/strikes/member/${memberId}`);
      return data;
    },
    enabled: !!memberId,
  });
}

export function useStrikeSummary() {
  return useQuery({
    queryKey: ["strikes", "summary"],
    queryFn: async () => {
      const { data } = await api.get("/strikes/summary");
      return data;
    },
  });
}

export function useAssignStrike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, reason }) => {
      const { data } = await api.post("/strikes", { memberId, reason });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["strikes"] });
    },
  });
}
