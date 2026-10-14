import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";

export const SHOWCASE_SLUG = "project-showcase-semester-kickoff-2026";

export function useShowcase() {
  return useQuery({ queryKey: ["showcase", "public"], queryFn: async () =>
    (await api.get(`/events/public/${SHOWCASE_SLUG}`)).data, refetchInterval: 30000 });
}
export function useMyTicket(eventId, enabled) {
  return useQuery({ queryKey: ["showcase", eventId, "ticket"], enabled: Boolean(eventId && enabled),
    queryFn: async () => (await api.get(`/events/${eventId}/my-ticket`)).data });
}
export function useReserveSeat(eventId) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async (academicYear) => (await api.post(`/events/${eventId}/rsvp`, { academicYear })).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["showcase"] }); queryClient.invalidateQueries({ queryKey: ["events"] }); } });
}
export function useCancelSeat(eventId) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async () => (await api.delete(`/events/${eventId}/rsvp`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["showcase"] }) });
}
export function useStaffRoster(eventId, enabled) {
  return useQuery({ queryKey: ["showcase", eventId, "roster"], enabled: Boolean(eventId && enabled),
    queryFn: async () => (await api.get(`/events/${eventId}/registrations`)).data });
}
export function useRedeemTicket(eventId) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async (ticket) => (await api.post(`/events/${eventId}/check-ins`, { ticket })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["showcase", eventId, "roster"] }) });
}
