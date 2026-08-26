"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useHighContrast } from "@/hooks/use-high-contrast";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize accessibility theme sync
  useHighContrast();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
