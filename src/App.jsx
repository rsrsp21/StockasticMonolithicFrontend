import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AccountStatus from "./pages/AccountStatus";
import Market from "./pages/Market";
import Explore from "./pages/Explore";
import StockDetail from "./pages/StockDetail";
import Profile from "./pages/Profile";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserApprovals from "./pages/admin/UserApprovals";
import ManageStocks from "./pages/admin/ManageStocks";
import ManageUsers from "./pages/admin/ManageUsers";
import SystemHealth from "./pages/admin/SystemHealth";
import NotFound from "./pages/NotFound";
import Watchlist from "./pages/Watchlist";
import Wallet from "./pages/Wallet";
import Portfolio from "./pages/Portfolio"; // This is the new Portfolio (formerly Dashboard)
import Holdings from "./pages/Holdings"; // This is the new Holdings (formerly Portfolio)
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Support from "./pages/Support";


import NotificationsPage from "./pages/NotificationsPage";
import PriceAlertsPage from "./pages/PriceAlertsPage";

import AutoSellPage from "./pages/AutoSellPage";
import SipPage from "./pages/SipPage";
import Reports from "./pages/Reports";
import Compare from "./pages/Compare";
import AskAi from "./pages/AskAi";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserProfile, fetchKYCStatus, setCredentials } from "./store/slices/authSlice";
import { NotificationProvider } from "./context/NotificationContext";
import { DashboardLayout } from "./layouts/DashboardLayout";
import axios from "axios";
import { SkeletonRootLayout } from "./components/ui/SkeletonRootLayout";
import { ThemeProvider } from "./components/theme-provider";

const queryClient = new QueryClient();

// Layout wrapper components for persistent layouts
const UserLayoutWrapper = () => (
  <DashboardLayout>
    <Outlet />
  </DashboardLayout>
);

const AdminLayoutWrapper = () => (
  <DashboardLayout isAdmin={true}>
    <Outlet />
  </DashboardLayout>
);

const AppContent = () => {
  const dispatch = useDispatch();
  const { token, user, kycStatus, isAuthenticated } = useSelector((state) => state.auth);
  const [isAuthChecking, setIsAuthChecking] = useState(true); // Always check on mount

  useEffect(() => {
    const initAuth = async () => {
      // Always try to refresh token on mount (token is not persisted)
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refreshtoken`,
          {},
          { withCredentials: true }
        );
        const { accessToken } = response.data;
        dispatch(setCredentials({ token: accessToken }));
        // Don't set isAuthChecking to false here - wait for user profile
      } catch (error) {
        // No valid session, remain logged out
        setIsAuthChecking(false);
      }
    };

    initAuth();
  }, [dispatch]); // Run once on mount

  useEffect(() => {
    if (token) {
      // Always fetch user profile to ensure role is set (role is not persisted)
      dispatch(fetchUserProfile()).then(() => {
        setIsAuthChecking(false);
      }).catch(() => {
        setIsAuthChecking(false);
      });

      // Always fetch fresh KYC status on auth (not just when null)
      // This ensures the banner updates after admin approval + page reload
      dispatch(fetchKYCStatus());
    }
  }, [token, dispatch]);

  if (isAuthChecking) {
    return (
      <SkeletonRootLayout />
    );
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NotificationProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account-status" element={<AccountStatus />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/support" element={<Support />} />

          {/* USER-FACING routes all under one persistent DashboardLayout */}
          <Route element={<UserLayoutWrapper />}>
            {/* Public user-facing routes */}
            <Route path="/stock/:stockId" element={<StockDetail />} />
            <Route path="/market" element={<Market />} />
            <Route path="/ask-ai" element={<AskAi />} />
            <Route path="/explore" element={<Explore />} />

            {/* Protected user routes */}
            <Route element={<ProtectedRoute allowedRoles={["ROLE_USER"]} />}>
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/holdings" element={<Holdings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/alerts" element={<PriceAlertsPage />} />
              <Route path="/auto-sell" element={<AutoSellPage />} />
              <Route path="/sip" element={<SipPage />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Route>

          {/* ADMIN routes - wrapped with persistent DashboardLayout */}
          <Route element={<ProtectedRoute allowedRoles={["ROLE_ADMIN"]} />}>
            <Route element={<AdminLayoutWrapper />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/market" element={<Market />} />
              <Route path="/admin/ask-ai" element={<AskAi />} />
              <Route path="/admin/approvals" element={<UserApprovals />} />
              <Route path="/admin/manage-stocks" element={<ManageStocks />} />
              <Route path="/admin/manage-users" element={<ManageUsers />} />
              <Route path="/admin/system-health" element={<SystemHealth />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </NotificationProvider>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
