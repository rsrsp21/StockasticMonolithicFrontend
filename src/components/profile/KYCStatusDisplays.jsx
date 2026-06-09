import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";

export function KYCApproved() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-positive/5 to-positive/10 rounded-lg" />
      <div className="relative p-8 rounded-lg border border-positive/20 text-center space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-positive/10">
          <CheckCircle className="h-8 w-8 text-positive" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            KYC Verified Successfully!
          </h3>
          <p className="text-muted-foreground">
            Your account is fully verified. You can now access all trading features.
          </p>
        </div>
      </div>
    </div>
  );
}

export function KYCPending() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 rounded-lg" />
      <div className="relative p-8 rounded-lg border border-yellow-500/20 space-y-4">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
            <Clock className="h-8 w-8 text-yellow-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Verification in Progress
            </h3>
            <p className="text-muted-foreground">
              Your documents are being reviewed. This usually takes 24-48 hours.
            </p>
          </div>
        </div>

        <Alert className="bg-yellow-500/5 border-yellow-500/20">
          <AlertDescription className="text-xs text-muted-foreground">
            You will receive a notification once verification is complete.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

export function KYCRejected({ rejectionReason, attemptCount }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-1">
          <p className="font-medium">KYC Verification Rejected</p>
          <p className="text-sm">
            {rejectionReason || "Your documents could not be verified. Please review and resubmit."}
          </p>
          <p className="text-xs mt-2 opacity-80">
            Attempt {attemptCount} of 3
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
