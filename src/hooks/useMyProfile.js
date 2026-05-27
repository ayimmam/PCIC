import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";

export function useMyProfile() {
  return useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { data } = await api.get("/members/me");
      return data;
    },
  });
}

export function useMyStrikes() {
  return useQuery({
    queryKey: ["my-strikes"],
    queryFn: async () => {
      const { data } = await api.get("/members/me/strikes");
      return data;
    },
  });
}

export function useMyAttendance() {
  return useQuery({
    queryKey: ["my-attendance"],
    queryFn: async () => {
      const { data } = await api.get("/members/me/attendance");
      return data;
    },
  });
}

export function useUpdateMyName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name) => {
      const { data } = await api.put("/members/me/name", { name });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      qc.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const { data } = await api.put("/members/me/password", {
        currentPassword,
        newPassword,
      });
      return data;
    },
  });
}
