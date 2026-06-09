
import { User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ProfilePicture } from "../components/profile/ProfilePicture";
import { PersonalInfoForm } from "../components/profile/PersonalInfoForm";
import { KYCVerification } from "../components/profile/KYCVerification";
import { fetchKYCStatus } from "../store/slices/authSlice";
// import { NotificationSettings } from "../components/profile/NotificationSettings";
import { SecuritySettings } from "../components/profile/SecuritySettings";
import { usePageTitle } from "../hooks/usePageTitle";

export default function Profile() {
  usePageTitle("Profile");
  const dispatch = useDispatch();
  const { user, loading, kycStatus, kycDetails } = useSelector((state) => state.auth);
  const { attemptCount, rejectionReason } = kycDetails || {};


  // Wrapper for refetching
  const setKycStatus = () => dispatch(fetchKYCStatus());

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [activeTab, setActiveTab] = useState("personal");
  const [kycRefreshTrigger, setKycRefreshTrigger] = useState(0);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name,
        email: user.email,
        phone: user.mobile,
      });
    }
  }, [user]);

  // Refresh KYC status when KYC tab is clicked
  const handleTabChange = (tabValue) => {
    setActiveTab(tabValue);
    if (tabValue === "kyc") {
      setKycRefreshTrigger(prev => prev + 1);
    }
  };

  if (loading || !profile) return null;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="h-7 w-7 text-primary" />
            Profile Management
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* KYC Status Banner */}


        {/* Profile Picture - Always visible, outside tabs */}
        <ProfilePicture
          user={user}
          profile={profile}
          kycStatus={kycStatus}
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-surface">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="kyc">KYC Verification</TabsTrigger>
            {/* <TabsTrigger value="notifications">Notifications</TabsTrigger> */}
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="space-y-6">
            <PersonalInfoForm profile={profile} setProfile={setProfile} />
          </TabsContent>

          {/* KYC Verification Tab */}
          <TabsContent value="kyc" className="space-y-6">
            <KYCVerification
              kycStatus={kycStatus}
              setKycStatus={setKycStatus}
              attemptCount={attemptCount}
              rejectionReason={rejectionReason}
              triggerRefresh={kycRefreshTrigger}
            />
          </TabsContent>

          {/* Notifications Tab */}
          {/* <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent> */}

          {/* Security Tab */}
          <TabsContent value="security">
            <SecuritySettings />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}