import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { fetchKYCStatus } from "../../store/slices/authSlice";
import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../utils/constants/endpoints";
import { KYCApproved, KYCPending, KYCRejected } from "./KYCStatusDisplays";
import { KYCForm } from "./KYCForm";
import { MESSAGES } from "../../utils/constants/messages";
import { validatePAN, validateAadhaar } from "../../utils/utils";

export function KYCVerification({
  kycStatus,
  setKycStatus,
  attemptCount,
  rejectionReason,
  triggerRefresh,
}) {
  const dispatch = useDispatch();
  const [kycForm, setKycForm] = useState({
    panNumber: "",
    aadhaarNumber: "",
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Refetch KYC status when this component mounts or triggerRefresh changes
  useEffect(() => {
    dispatch(fetchKYCStatus());
  }, [triggerRefresh, dispatch]);

  const handleSubmit = async () => {
    const newErrors = {};

    if (!kycForm.panNumber) {
      newErrors.panNumber = MESSAGES.VALIDATION.PAN_REQUIRED;
    } else if (!validatePAN(kycForm.panNumber.toUpperCase())) {
      newErrors.panNumber = MESSAGES.VALIDATION.PAN_INVALID;
    }

    if (!kycForm.aadhaarNumber) {
      newErrors.aadhaarNumber = MESSAGES.VALIDATION.AADHAAR_REQUIRED;
    } else if (!validateAadhaar(kycForm.aadhaarNumber)) {
      newErrors.aadhaarNumber = MESSAGES.VALIDATION.AADHAAR_INVALID;
    }

    if (!uploadedFile) {
      newErrors.document = MESSAGES.VALIDATION.DOC_REQUIRED;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(MESSAGES.ERROR.FIX_ERRORS);
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("panNumber", kycForm.panNumber.toUpperCase());
      formData.append("aadhaarNumber", kycForm.aadhaarNumber.replace(/\s/g, ""));
      formData.append("document", uploadedFile);

      await axiosInstance.post(API_ENDPOINTS.USER.KYC, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Refresh KYC status from backend
      await dispatch(fetchKYCStatus()).unwrap();

      toast.success(MESSAGES.SUCCESS.KYC_SUBMITTED);

      // Clear form
      setKycForm({ panNumber: "", aadhaarNumber: "" });
      setUploadedFile(null);
      setErrors({});
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || MESSAGES.ERROR.KYC_SUBMISSION_FAILED);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          KYC Verification
        </CardTitle>
        <CardDescription>
          Complete KYC verification to enable trading features
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {kycStatus === "APPROVED" && <KYCApproved />}

        {kycStatus === "PENDING" && <KYCPending />}

        {kycStatus === "REJECTED" && (
          <>
            <KYCRejected
              rejectionReason={rejectionReason}
              attemptCount={attemptCount}
            />
            {attemptCount < 3 && (
              <KYCForm
                kycForm={kycForm}
                setKycForm={setKycForm}
                uploadedFile={uploadedFile}
                setUploadedFile={setUploadedFile}
                errors={errors}
                setErrors={setErrors}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
              />
            )}
          </>
        )}

        {kycStatus === "NOT_ATTEMPTED" && (
          <KYCForm
            kycForm={kycForm}
            setKycForm={setKycForm}
            uploadedFile={uploadedFile}
            setUploadedFile={setUploadedFile}
            errors={errors}
            setErrors={setErrors}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        )}
      </CardContent>
    </Card>
  );
}
