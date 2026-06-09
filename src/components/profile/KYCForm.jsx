import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Upload, FileText, CreditCard, IdCard, X, CheckCheck, Clock, Shield } from "lucide-react";
import { toast } from "sonner";
import { MESSAGES } from "../../utils/constants/messages";

export function KYCForm({
  kycForm,
  setKycForm,
  uploadedFile,
  setUploadedFile,
  errors,
  setErrors,
  isSubmitting,
  onSubmit
}) {
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error(MESSAGES.VALIDATION.FILE_TYPE);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(MESSAGES.VALIDATION.FILE_SIZE);
      return;
    }

    setUploadedFile(file);
    setErrors({ ...errors, document: null });
    toast.success(MESSAGES.KYC.DOC_UPLOADED);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          Ensure documents are clear and readable. Supported formats: JPG, PNG, PDF (max 5MB).
        </p>
      </div>

      {/* PAN Number */}
      <div className="space-y-2">
        <Label htmlFor="pan" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          PAN Number
        </Label>
        <Input
          id="pan"
          placeholder="ABCDE1234F"
          value={kycForm.panNumber}
          onChange={(e) => {
            setKycForm({ ...kycForm, panNumber: e.target.value.toUpperCase() });
            setErrors({ ...errors, panNumber: null });
          }}
          className={errors.panNumber ? "border-destructive" : ""}
          maxLength={10}
          disabled={isSubmitting}
        />
        {errors.panNumber && (
          <p className="text-xs text-destructive">{errors.panNumber}</p>
        )}
      </div>

      {/* Aadhaar Number */}
      <div className="space-y-2">
        <Label htmlFor="aadhaar" className="flex items-center gap-2">
          <IdCard className="h-4 w-4" />
          Aadhaar Number
        </Label>
        <Input
          id="aadhaar"
          placeholder="1234 5678 9012"
          value={kycForm.aadhaarNumber}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
            setKycForm({ ...kycForm, aadhaarNumber: formatted });
            setErrors({ ...errors, aadhaarNumber: null });
          }}
          className={errors.aadhaarNumber ? "border-destructive" : ""}
          maxLength={14}
          disabled={isSubmitting}
        />
        {errors.aadhaarNumber && (
          <p className="text-xs text-destructive">{errors.aadhaarNumber}</p>
        )}
      </div>

      {/* Document Upload */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Aadhaar Document
        </Label>

        {!uploadedFile ? (
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <input
              id="doc"
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isSubmitting}
            />
            <label htmlFor="doc" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Upload document</p>
              <p className="text-xs text-muted-foreground">JPG, PNG or PDF (max 5MB)</p>
            </label>
          </div>
        ) : (
          <div className="border rounded-lg p-3 flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUploadedFile(null)}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {errors.document && (
          <p className="text-xs text-destructive">{errors.document}</p>
        )}
      </div>

      <Button onClick={onSubmit} className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Clock className="h-4 w-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <CheckCheck className="h-4 w-4 mr-2" />
            Submit for Verification
          </>
        )}
      </Button>
    </div>
  );
}