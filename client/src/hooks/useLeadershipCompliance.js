import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";

export function useComplianceDashboard(semester, viewerScope = "anonymous") {
  return useQuery({
    queryKey: ["leadership-compliance", "dashboard", viewerScope, semester || "current"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (semester) params.set("semester", semester);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const { data } = await api.get(`/leadership-compliance/dashboard${suffix}`);
      return data;
    },
  });
}

export function useComplianceSubmissionHistory(semester, domainLeaderId, viewerScope = "anonymous", enabled = true) {
  return useQuery({
    queryKey: [
      "leadership-compliance",
      "history",
      viewerScope,
      semester || "current",
      domainLeaderId || "none",
    ],
    enabled: Boolean(enabled && semester && domainLeaderId),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("semester", semester);
      params.set("domainLeaderId", domainLeaderId);
      const { data } = await api.get(`/leadership-compliance/submissions/history?${params.toString()}`);
      return data;
    },
  });
}

export function useSubmitComplianceReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData) => {
      const { data } = await api.post("/leadership-compliance/submissions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadership-compliance"] });
    },
  });
}

export function useAddComplianceFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reportId, message }) => {
      const { data } = await api.post(`/leadership-compliance/submissions/${reportId}/feedback`, {
        message,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadership-compliance"] });
    },
  });
}