import { useMutation, useQuery } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Item, Res } from "@/lib/api/types";

export type MyDocument = Item<"GET /me/documents">;

export function useMyDocuments() {
  return useQuery({
    queryKey: ["documents", "me"],
    queryFn: async () => (await http.get<Res<"GET /me/documents">>("/me/documents")).data,
  });
}

/** A short-lived link to the file. Minted on request, like a payslip PDF. */
export function useDocumentDownload() {
  return useMutation({
    mutationFn: async (id: string) => (await http.post<Res<"POST /me/documents/{id}/download">>(`/me/documents/${id}/download`)).data.url,
  });
}
