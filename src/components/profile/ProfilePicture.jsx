import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Camera, CheckCircle, AlertTriangle } from "lucide-react";
import { useRef, useState, memo, useEffect } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../utils/constants/endpoints";
import { MESSAGES } from "../../utils/constants/messages";
import { updateUserProfile } from "../../store/slices/authSlice";

export const ProfilePicture = memo(function ProfilePicture({ user, profile, kycStatus }) {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  // Local state for displaying the current image
  const [currentImageUrl, setCurrentImageUrl] = useState("");

  // Initialize and update image URL from user.profileImagePath
  useEffect(() => {
    if (user.profileImagePath) {
      setCurrentImageUrl(`${API_ENDPOINTS.CONFIG.PROFILE_IMAGE_URL}/${user.profileImagePath}`);
    }
  }, [user.profileImagePath]);

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // validation
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error(MESSAGES.VALIDATION.IMAGE_FORMAT);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(MESSAGES.VALIDATION.IMAGE_SIZE);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axiosInstance.put(API_ENDPOINTS.USER.IMAGE, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(MESSAGES.PROFILE.PIC_UPDATED);

      // Update Redux store so navbar avatar updates immediately
      dispatch(updateUserProfile({ profileImagePath: res.data.profileImagePath }));

      // Force reload the new image with cache-busting
      const newImageUrl = `${API_ENDPOINTS.CONFIG.PROFILE_IMAGE_URL}/${res.data.profileImagePath}?t=${Date.now()}`;
      setCurrentImageUrl(newImageUrl);

      e.target.value = "";
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error(
        err?.response?.data?.message || "Failed to upload profile picture"
      );
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        {/* Avatar + camera */}
        <div className="relative inline-block">
          <div
            className="cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Change profile picture"
          >
            <Avatar className="h-24 w-24 rounded-full overflow-hidden">
              <AvatarImage
                src={currentImageUrl}
                className="object-cover w-full h-full"
              />
              <AvatarFallback className="text-xl bg-primary/10 text-primary flex items-center justify-center">
                {profile.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>

          <input
            ref={fileInputRef}
            id="profile-image-upload"
            type="file"
            accept="image/png,image/jpeg"
            className="sr-only"
            onChange={handleProfileImageUpload}
          />

          <button
            type="button"
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            aria-label="Upload profile picture"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>

        {/* Text beside avatar */}
        <div>
          <p className="font-semibold text-foreground">{profile.name}</p>
          <p className="text-sm text-muted-foreground">{profile.email}</p>

          <div className="flex items-center gap-2 mt-1">
            {kycStatus === "APPROVED" ? (
              <span className="flex items-center gap-1 text-xs text-positive">
                <CheckCircle className="h-3 w-3" />
                KYC Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-orange-500">
                <AlertTriangle className="h-3 w-3" />
                KYC Pending
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});