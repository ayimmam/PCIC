import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = import.meta.env.PROD
  ? "https://pcic-hpw7.vercel.app/api/peak-projects"
  : "/api/peak-projects";

async function fetchComments(slug) {
  const res = await fetch(`${API_BASE}/comments/${slug}`);
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}

async function createComment({ projectSlug, authorName, body, type }) {
  const res = await fetch(`${API_BASE}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectSlug, authorName, body, type }),
  });
  if (res.status === 429) {
    throw new Error("Too many comments — please wait a few minutes");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to post comment");
  }
  return res.json();
}

export function usePublicComments(slug) {
  return useQuery({
    queryKey: ["peak-project-comments", slug],
    queryFn: () => fetchComments(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 2,
  });
}

export function usePostPublicComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createComment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["peak-project-comments", variables.projectSlug],
      });
    },
  });
}
