import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../utils/constants/endpoints";

import { MESSAGES } from "../../utils/constants/messages";
import { validateStrongPassword } from "../../utils/utils";

export function SecuritySettings() {
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Prevent multiple rapid clicks by disabling button for a few seconds
  const [isUpdating, setIsUpdating] = useState(false);

  // visibility toggles for each password field
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    if (isUpdating) return; // guard early to avoid duplicate requests

    const { oldPassword, newPassword, confirmPassword } = passwordForm;

    // Basic validations
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error(MESSAGES.ERROR.REQUIRED_FIELDS);
      return;
    }

    // Prevent sending request if old and new passwords are the same
    if (oldPassword === newPassword) {
      toast.error(MESSAGES.ERROR.SAME_PASSWORD);
      return;
    }

    if (!validateStrongPassword(newPassword)) {
      toast.error(MESSAGES.ERROR.WEAK_PASSWORD);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(MESSAGES.ERROR.PASSWORD_MISMATCH);
      return;
    }

    setIsUpdating(true);
    const minDelay = new Promise((resolve) => setTimeout(resolve, 3000)); // minimum disable time

    try {
      // Ensure button remains disabled for at least `minDelay`
      await Promise.all([
        axiosInstance.put(API_ENDPOINTS.USER.PASSWORD, {
          oldPassword,
          newPassword,
        }),
        minDelay,
      ]);

      toast.success(MESSAGES.SUCCESS.PASSWORD_UPDATED);

      // Clear form after success
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      // Wait for minDelay if request failed quickly
      await minDelay;
      console.error(err);
      toast.error(err?.response?.data?.message || MESSAGES.ERROR.PASSWORD_UPDATE_FAILED);
    } finally {
      setIsUpdating(false);
      // reset visibility after operation (optional)
      setShowOld(false);
      setShowNew(false);
      setShowConfirm(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Current Password</Label>
          <div className="relative">
            <Input
              type={showOld ? "text" : "password"}
              placeholder="Enter current password"
              value={passwordForm.oldPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  oldPassword: e.target.value,
                })
              }
              disabled={isUpdating}
            />
            <button
              type="button"
              onClick={() => setShowOld((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label={
                showOld ? "Hide current password" : "Show current password"
              }
              disabled={isUpdating}
            >
              {showOld ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>New Password</Label>
          <div className="relative">
            <Input
              type={showNew ? "text" : "password"}
              placeholder="Enter new password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: e.target.value,
                })
              }
              disabled={isUpdating}
            />
            <button
              type="button"
              onClick={() => setShowNew((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label={showNew ? "Hide new password" : "Show new password"}
              disabled={isUpdating}
            >
              {showNew ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Confirm New Password</Label>
          <div className="relative">
            <Input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm new password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: e.target.value,
                })
              }
              disabled={isUpdating}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label={
                showConfirm ? "Hide confirm password" : "Show confirm password"
              }
              disabled={isUpdating}
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button onClick={handleChangePassword} disabled={isUpdating}>
          {isUpdating ? "Updating..." : "Update Password"}
        </Button>
      </CardContent>
    </Card>
  );
}
