import { Card, CardContent } from "../ui/card";
import { AlertTriangle, Shield } from "lucide-react";

export function KYCStatusBanner({ kycStatus, isLoading }) {
  // Don't show banner while loading or if KYC is approved
  if (isLoading || kycStatus === "APPROVED") {
    return null;
  }

  return (
    <Card
      className={`border-2 ${
        kycStatus === "REJECTED"
          ? "border-destructive bg-destructive/5"
          : kycStatus === "PENDING"
          ? "border-yellow-500 bg-yellow-500/5"
          : "border-orange-500 bg-orange-500/5"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {kycStatus === "REJECTED" ? (
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          ) : kycStatus === "PENDING" ? (
            <Shield className="h-5 w-5 text-yellow-500 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-semibold text-foreground">
              {kycStatus === "REJECTED"
                ? "KYC Rejected"
                : kycStatus === "PENDING"
                ? "KYC Verification Pending"
                : "KYC Not Completed"}
            </p>
            <p className="text-sm text-muted-foreground">
              {kycStatus === "REJECTED"
                ? "Your KYC was rejected. Please re-upload your documents."
                : kycStatus === "PENDING"
                ? "Your documents are under review. This usually takes 24-48 hours."
                : "Complete your KYC verification to enable Buy/Sell functionality."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
