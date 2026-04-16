import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";

/* ── projects ────────────────────────────────────────── */

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await api.get("/projects");
      return data;
    },
  });
}

export function useProject(id) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const { data } = await api.post("/projects", body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }) => {
      const { data } = await api.put(`/projects/${id}`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useSetRepoUrl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, repoUrl }) => {
      const { data } = await api.put(`/projects/${id}/repo`, { repoUrl });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

/* ── todos ────────────────────────────────────────────── */

export function useAddTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, ...body }) => {
      const { data } = await api.post(`/projects/${projectId}/todos`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, todoId, ...body }) => {
      const { data } = await api.put(`/projects/${projectId}/todos/${todoId}`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

/* ── weekly reports ──────────────────────────────────── */

export function useWeeklyReports(projectId) {
  return useQuery({
    queryKey: ["projects", projectId, "reports"],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/reports`);
      return data;
    },
    enabled: !!projectId,
  });
}

export function useSubmitReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, ...body }) => {
      const { data } = await api.post(`/projects/${projectId}/reports`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useScoreReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, reportId, qualityScore }) => {
      const { data } = await api.put(
        `/projects/${projectId}/reports/${reportId}/score`,
        { qualityScore }
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

/* ── resources ───────────────────────────────────────── */

export function useProjectResources(projectId) {
  return useQuery({
    queryKey: ["projects", projectId, "resources"],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/resources`);
      return data;
    },
    enabled: !!projectId,
  });
}

export function useAddResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, ...body }) => {
      const { data } = await api.post(`/projects/${projectId}/resources`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

/* ── issues ──────────────────────────────────────────── */

export function useProjectIssues(projectId) {
  return useQuery({
    queryKey: ["projects", projectId, "issues"],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/issues`);
      return data;
    },
    enabled: !!projectId,
  });
}

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, ...body }) => {
      const { data } = await api.post(`/projects/${projectId}/issues`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useReplyIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, issueId, ...body }) => {
      const { data } = await api.post(
        `/projects/${projectId}/issues/${issueId}/reply`,
        body
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

/* ── burndown ────────────────────────────────────────── */

export function useBurndown(projectId) {
  return useQuery({
    queryKey: ["projects", projectId, "burndown"],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/burndown`);
      return data;
    },
    enabled: !!projectId,
  });
}

export function useBurndownSummary() {
  return useQuery({
    queryKey: ["projects", "burndown-summary"],
    queryFn: async () => {
      const { data } = await api.get("/projects/burndown-summary");
      return data;
    },
  });
}
