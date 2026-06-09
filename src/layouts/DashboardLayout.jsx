import { Sidebar } from "./Sidebar";
import { Menu, PanelLeft, Sparkles, TrendingUp } from "lucide-react";
import { NotificationCenter } from "../components/shared/NotificationCenter";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { useSelector, useDispatch } from "react-redux";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, User as UserIcon, Settings, HelpCircle } from "lucide-react";
import { KYCStatusBanner } from "../components/profile/KYCStatusBanner";
import logo from "../assets/logo.png";
import { Footer } from "../components/shared/Footer";
import { logout } from "../store/slices/authSlice";
import { API_ENDPOINTS } from "../utils/constants/endpoints";
import { MESSAGES } from "../utils/constants/messages";
import { ThemeToggle } from "../components/shared/ThemeToggle";
import { getTodayMarketClosureNotice } from "../utils/marketUtils";

export function DashboardLayout({ children, isAdmin = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile overlay
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop collapse
  const dispatch = useDispatch();
  const { user, role, kycStatus, loading } = useSelector((state) => state.auth);
  const isAdminView = isAdmin || role === "ROLE_ADMIN";
  const navigate = useNavigate();
  const marketClosureNotice = getTodayMarketClosureNotice();

  // Memoize the profile image URL to prevent unnecessary reloads
  const profileImageUrl = useMemo(() => {
    return user?.profileImagePath
      ? `${API_ENDPOINTS.CONFIG.PROFILE_IMAGE_URL}/${user.profileImagePath}`
      : "";
  }, [user?.profileImagePath]);

  const handleLogout = async () => {
    try {
      // Call backend to clear the HttpOnly refresh token cookie
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Important: send cookies with the request
      });
    } catch (err) {
      console.error('Failed to logout from server:', err);
      // Continue with local logout even if server logout fails
    }

    // Clear Redux state
    dispatch(logout());
    toast.success(MESSAGES.SUCCESS.AUTH.LOGOUT);
    navigate("/login");
  };

  const toggleDesktopSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="gradient-orb gradient-orb-1 opacity-20" />
      <div className="gradient-orb gradient-orb-2 opacity-20" />

      {/* Noise texture overlay */}
      <div className="noise-bg fixed inset-0 pointer-events-none z-0" />

      <Sidebar
        isAdmin={isAdminView}
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div
        className={`relative z-10 transition-all duration-300 flex flex-col min-h-screen ${sidebarCollapsed ? "lg:pl-0" : "lg:pl-72"
          }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 glass-panel border-b border-border/30">
          <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center px-4 lg:px-6">
            {/* Left: Logo + Toggle */}
            <div className="flex items-center gap-3 justify-self-start min-w-0">
              {/* Mobile Hamburger */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden hover:bg-muted/50"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Desktop Sidebar Toggle */}
              <button
                onClick={toggleDesktopSidebar}
                className="hidden lg:flex items-center justify-center h-8 w-8 rounded-lg border border-border/40 bg-muted/30 hover:bg-primary/10 hover:border-primary/30 text-muted-foreground hover:text-primary transition-all duration-200"
                title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
              >
                <PanelLeft className="h-4 w-4" />
              </button>


              {/* Logo - Always show on mobile, show on desktop when collapsed */}
              <div
                className={`flex items-center gap-2 cursor-pointer ${sidebarCollapsed ? "lg:flex" : "lg:hidden"}`}
                onClick={() => navigate(isAdminView ? "/admin" : (user ? "/portfolio" : "/"))}
              >
                <img src={logo} alt="Stockastic" className="h-8 w-8 object-contain" />
                <span className="text-lg font-bold text-foreground tracking-tight">
                  Stockastic
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3 justify-self-center">
              <Button
                variant="outline"
                onClick={() => navigate(isAdminView ? "/admin/ask-ai" : "/ask-ai")}
                className="group h-11 rounded-full border-primary/45 bg-transparent px-6 text-sm font-semibold text-primary shadow-[0_0_0_1px_rgba(255,122,69,0.22),0_0_14px_rgba(255,122,69,0.16)] backdrop-blur-sm transition-all duration-300 hover:border-primary/70 hover:bg-transparent hover:text-primary hover:shadow-[0_0_0_1px_rgba(255,122,69,0.34),0_0_18px_rgba(255,122,69,0.22)]"
              >
                <span className="flex items-center text-primary [text-shadow:0_0_10px_rgba(255,122,69,0.45)]">
                  <Sparkles className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                  Ask AI
                </span>
              </Button>
              {!isAdminView && (
                <Button
                  onClick={() => navigate("/explore")}
                  className="h-11 rounded-full bg-gradient-to-r from-primary to-orange-500 px-6 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:from-primary/90 hover:to-orange-500/90"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Explore Stocks
                </Button>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 lg:gap-3 justify-self-end">
              <ThemeToggle />
              {user ? (
                <>
                  {/* Notifications */}
                  <NotificationCenter />

                  {/* User Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative rounded-full p-0 h-10 w-10 hover:ring-2 hover:ring-primary/50 transition-all"
                      >
                        <Avatar className="h-10 w-10 border-2 border-border/40">
                          <AvatarImage
                            src={profileImageUrl}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-gradient-to-br from-primary/30 to-orange-500/30 text-foreground font-semibold">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="w-60 glass-card border-border/40 p-2"
                    >
                      <DropdownMenuLabel className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border/40">
                            <AvatarImage
                              src={profileImageUrl}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-orange-500/30 text-foreground font-semibold">
                              {user?.name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {user?.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuLabel>

                      <DropdownMenuSeparator className="bg-border/30 my-2" />

                      {!isAdminView && (
                        <>
                          <DropdownMenuItem
                            onClick={() => navigate("/profile")}
                            className="cursor-pointer rounded-lg hover:bg-muted/50 p-2.5"
                          >
                            <UserIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                            <span>Profile</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => navigate("/support")}
                            className="cursor-pointer rounded-lg hover:bg-muted/50 p-2.5"
                          >
                            <HelpCircle className="mr-3 h-4 w-4 text-muted-foreground" />
                            <span>Help & Support</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="bg-border/30 my-2" />
                        </>
                      )}

                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer rounded-lg hover:bg-red-500/10 p-2.5 text-red-400 focus:text-red-400"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                    Login
                  </Button>
                  <Button size="sm" onClick={() => navigate("/register")}>
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        {marketClosureNotice && (
          <div className="px-4 lg:px-6 pt-4">
            <div className="rounded-xl border border-emerald-700 bg-emerald-900 px-4 py-3 text-sm font-medium text-emerald-50 shadow-md">
              {marketClosureNotice}
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="p-4 lg:p-6 pb-10">
          {!isAdminView && user && <div className="mb-6"><KYCStatusBanner kycStatus={kycStatus} isLoading={loading} /></div>}
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
