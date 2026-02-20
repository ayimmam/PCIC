import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";

export function useEvents(filters = {}) {
  return useQuery({
    queryKey: ["events", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.domain) params.set("domain", filters.domain);
      if (filters.timeframe) params.set("timeframe", filters.timeframe);
      const { data } = await api.get(`/events?${params}`);
      return data;
    },
  });
}

export function useEventCount() {
  return useQuery({
    queryKey: ["events", "count"],
    queryFn: async () => {
      const { data } = await api.get("/events/count");
      return data;
    },
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventData) => {
      const { data } = await api.post("/events", eventData);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...eventData }) => {
      const { data } = await api.put(`/events/${id}`, eventData);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, memberId }) => {
      const { data } = await api.post(`/events/${eventId}/checkin`, { memberId });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}
