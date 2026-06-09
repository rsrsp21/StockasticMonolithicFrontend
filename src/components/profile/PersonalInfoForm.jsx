import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { User, Edit2, X, Save, Phone as PhoneIcon, Mail } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "../../services/userService";
import { useState } from "react";

import { MESSAGES } from "../../utils/constants/messages";

export function PersonalInfoForm({ profile, setProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: profile.name,
    phone: profile.phone,
  });

  const handleEditClick = () => {
    setEditedProfile({
      name: profile.name,
      phone: profile.phone,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile({
      name: profile.name,
      phone: profile.phone,
    });
  };

  const handleSaveProfile = async () => {
    if (isSaving) return;

    // Validation
    if (!editedProfile.name.trim()) {
      toast.error(MESSAGES.ERROR.NAME_REQUIRED);
      return;
    }

    if (!editedProfile.phone.trim()) {
      toast.error(MESSAGES.ERROR.PHONE_REQUIRED);
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: editedProfile.name,
        mobile: editedProfile.phone,
      });

      // Update parent state only after successful save
      setProfile({
        ...profile,
        name: editedProfile.name,
        phone: editedProfile.phone,
      });

      toast.success(MESSAGES.SUCCESS.PROFILE_UPDATED);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error(MESSAGES.ERROR.PROFILE_UPDATE_FAILED);
    } finally {
      setIsSaving(false);
    }
  };

  // Check if there are any changes
  const hasChanges =
    editedProfile.name !== profile.name ||
    editedProfile.phone !== profile.phone;

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditClick}
              className="flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit Details
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isEditing ? (
          // ===== EDIT MODE =====
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editedProfile.name}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, name: e.target.value })
                  }
                  disabled={isSaving}
                  placeholder="Enter your full name"
                  className="transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-phone"
                    value={editedProfile.phone}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, phone: e.target.value })
                    }
                    disabled={isSaving}
                    placeholder="Enter your phone number"
                    className="pl-10 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-display">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email-display"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-muted/50 pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground"></span>
                  Email cannot be changed. Contact support for assistance.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving || !hasChanges}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="ghost"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              {hasChanges && !isSaving && (
                <Badge variant="secondary" className="ml-auto">
                  Unsaved changes
                </Badge>
              )}
            </div>
          </>
        ) : (
          // ===== VIEW MODE =====
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Full Name
                </Label>
                <p className="text-base font-medium text-foreground">
                  {profile.name}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Phone Number
                </Label>
                <p className="text-base font-medium text-foreground flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                  {profile.phone}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Email Address
              </Label>
              <p className="text-base font-medium text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {profile.email}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}