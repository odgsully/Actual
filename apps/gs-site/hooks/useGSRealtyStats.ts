"use client";

import { useQuery } from "@tanstack/react-query";

export interface GSRealtyStats {
  totalContacts: number;
  contactsThisMonth: number;
  activeDeals: number;
  pipelineRevenue: number;
  callsThisMonth: number;
  conversionRate: number;
}

async function fetchGSRealtyStats(): Promise<GSRealtyStats> {
  const response = await fetch("/api/gsrealty/stats");
  if (!response.ok) throw new Error("Failed to fetch CRM statistics");
  return response.json();
}

export function useGSRealtyStats(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["gsrealtyStats"],
    queryFn: fetchGSRealtyStats,
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
