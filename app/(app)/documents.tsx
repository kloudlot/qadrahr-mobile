import { Linking, View } from "react-native";
import { FileText, FolderOpen } from "lucide-react-native";

import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { Badge, type Tone } from "@/components/ui/Badge";
import { ScreenHeader } from "@/components/ui/Header";
import { Divider, ListCard, ListRow } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useDocumentDownload, useMyDocuments, type MyDocument } from "@/lib/queries/documents";

const STATUS: Record<MyDocument["status"], { tone: Tone; label: string }> = {
  pending_verification: { tone: "warning", label: "Being checked" },
  verified: { tone: "success", label: "Verified" },
  rejected: { tone: "danger", label: "Rejected" },
  expired: { tone: "danger", label: "Expired" },
  superseded: { tone: "neutral", label: "Replaced" },
};

/** The documents HR holds for me — IDs, certificates, contracts — and when they expire. */
export default function DocumentsScreen() {
  const documents = useMyDocuments();
  const download = useDocumentDownload();

  const open = (id: string) =>
    download.mutate(id, {
      onSuccess: (url) => void Linking.openURL(url),
      onError: (error) => toast.error("Couldn't open it", errorMessage(error)),
    });

  const rows = [...(documents.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Screen
      header={<ScreenHeader title="Documents" subtitle="What HR holds on file for you" />}
      refreshing={documents.isRefetching}
      onRefresh={() => void documents.refetch()}
    >
      <View className="pt-2">
        {documents.isLoading ? (
          <SkeletonList rows={4} />
        ) : documents.error ? (
          <ErrorView message={errorMessage(documents.error)} onRetry={() => void documents.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyView icon={FolderOpen} title="No documents yet" detail="Documents HR files for you appear here." />
        ) : (
          <ListCard>
            {rows.map((doc, i) => (
              <View key={doc._id}>
                {i > 0 ? <Divider inset={68} /> : null}
                <ListRow
                  icon={FileText}
                  iconTone="info"
                  title={doc.filename}
                  subtitle={
                    doc.status === "rejected" && doc.rejectionReason
                      ? doc.rejectionReason
                      : doc.expiresOn
                        ? `Expires ${formatDate(doc.expiresOn)}`
                        : `Added ${formatDate(doc.createdAt)}`
                  }
                  right={<Badge tone={STATUS[doc.status].tone}>{STATUS[doc.status].label}</Badge>}
                  onPress={() => open(doc._id)}
                />
              </View>
            ))}
          </ListCard>
        )}
      </View>
    </Screen>
  );
}
