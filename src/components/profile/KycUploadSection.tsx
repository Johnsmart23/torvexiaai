import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileText, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

interface KycUploadSectionProps {
  userId: string;
  kycStatus: string;
  kycDocumentUrl: string | null;
  kycRejectionReason: string | null;
  onUpdated: (url: string, status: string) => void;
}

const KycUploadSection = ({ userId, kycStatus, kycDocumentUrl, kycRejectionReason, onUpdated }: KycUploadSectionProps) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, WebP, or PDF file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${userId}/kyc-document.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("kyc-documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Generate a signed URL for admin review (private bucket)
      const { data: signedData, error: signedError } = await supabase.storage
        .from("kyc-documents")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

      if (signedError) throw signedError;

      const docUrl = signedData.signedUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ kyc_document_url: docUrl, kyc_status: "pending" } as any)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      onUpdated(docUrl, "pending");
      toast.success("KYC document uploaded! It will be reviewed shortly.");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const statusConfig = {
    pending: { icon: Clock, label: "Under Review", color: "text-warning", bg: "bg-warning/5 border-warning/30" },
    verified: { icon: CheckCircle, label: "Verified", color: "text-success", bg: "bg-success/5 border-success/30" },
    approved: { icon: CheckCircle, label: "Verified", color: "text-success", bg: "bg-success/5 border-success/30" },
    rejected: { icon: XCircle, label: "Rejected", color: "text-destructive", bg: "bg-destructive/5 border-destructive/30" },
  }[kycStatus] ?? { icon: Clock, label: kycStatus, color: "text-muted-foreground", bg: "bg-muted" };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <h2 className="mb-4 font-semibold text-foreground">KYC Verification</h2>

      {/* Status */}
      <div className={`mb-4 flex items-center gap-3 rounded-lg border p-3 ${statusConfig.bg}`}>
        <StatusIcon className={`h-5 w-5 shrink-0 ${statusConfig.color}`} />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Status: {statusConfig.label}</p>
          {kycStatus === "rejected" && kycRejectionReason && (
            <p className="text-xs text-destructive mt-0.5">Reason: {kycRejectionReason}</p>
          )}
          {kycStatus === "pending" && kycDocumentUrl && (
            <p className="text-xs text-muted-foreground">Your document is being reviewed by our team.</p>
          )}
        </div>
      </div>

      {/* Upload area */}
      {kycStatus !== "approved" && kycStatus !== "verified" && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Upload a government-issued ID (passport, national ID, or driver's license) to verify your identity.
          </p>
          <div
            onClick={() => !uploading && fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : kycDocumentUrl ? (
              <FileText className="h-8 w-8 text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <p className="text-sm font-medium text-foreground">
              {uploading ? "Uploading..." : kycDocumentUrl ? "Replace document" : "Click to upload"}
            </p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP, or PDF — Max 10MB</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      )}

      {(kycStatus === "approved" || kycStatus === "verified") && (
        <p className="text-sm text-success">Your identity has been verified. No further action needed.</p>
      )}
    </div>
  );
};

export default KycUploadSection;
