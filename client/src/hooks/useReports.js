import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";

export function useReportData(startDate, endDate) {
  return useQuery({
    queryKey: ["report-data", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const { data } = await api.get(`/reports/aggregate?${params}`);
      return data;
    },
    enabled: !!startDate && !!endDate,
  });
}
