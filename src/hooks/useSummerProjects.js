import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";

export function useMySummerSubmission(enabled = true) {
  return useQuery({
    queryKey: ["summer-projects", "mine"],
    queryFn: async () => {
      const { data } = await api.get("/summer-projects/mine");
      return data;
    },
    enabled: Boolean(enabled),
  });
}

export function usePendingSummerSubmissions(enabled) {
  return useQuery({
    queryKey: ["summer-projects", "pending"],
    queryFn: async () => {
      const { data } = await api.get("/summer-projects/pending");
      return data;
    },
    enabled: Boolean(enabled),
  });
}

export function useSubmitSummerProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData) => {
      const { data } = await api.post("/summer-projects", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["summer-projects", "mine"] });
      qc.invalidateQueries({ queryKey: ["summer-projects", "pending"] });
    },
  });
}

export function useGradeSummerProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, verdict, comment }) => {
      const { data } = await api.put(`/summer-projects/${id}/grade`, { verdict, comment });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["summer-projects", "pending"] });
      qc.invalidateQueries({ queryKey: ["summer-projects", "mine"] });
      qc.invalidateQueries({ queryKey: ["members"] });
    },
  });
}
