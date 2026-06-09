import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Shield,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { login as loginApi } from "../../services/authService";
import { loginSuccess } from "../../store/slices/authSlice";
import { toast } from "sonner";
import { MESSAGES } from "../../utils/constants/messages";
import logo from "../../assets/logo.png";
import { usePageTitle } from "../../hooks/usePageTitle";

export default function AdminLogin() {
  usePageTitle("Admin Login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, role } = useSelector((state) => state.auth);

  // Redirect authenticated users
  useEffect(() => {
    if (token) {
      if (role === "ROLE_ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/portfolio", { replace: true });
      }
    }
  }, [token, role, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await loginApi({ email, password });

      // Block non-admins
      if (data.role !== "ROLE_ADMIN") {
        toast.error(MESSAGES.ERROR.AUTH.UNAUTHORIZED);
        setIsLoading(false);
        return;
      }

      // Save token + role in redux
      dispatch(loginSuccess(data));

      toast.success(MESSAGES.ADMIN.LOGIN_SUCCESS);
      navigate("/admin");
    } catch (err) {
      console.error(err);
      const apiMessage = err?.response?.data?.message;
      toast.error(
        apiMessage && typeof apiMessage === "string"
          ? apiMessage
          : MESSAGES.ERROR.AUTH.INVALID_ADMIN
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="gradient-orb gradient-orb-1" />
      <div className="gradient-orb gradient-orb-2" />

      {/* Noise texture overlay */}
      <div className="noise-bg fixed inset-0 pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div
          className="flex items-center justify-center gap-3 mb-8 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => navigate('/')}
        >
          <img
            src={logo}
            alt="Stockastic Logo"
            className="h-12 w-12 object-contain"
          />
          <span className="text-2xl font-bold text-foreground tracking-tight">
            Stockastic
          </span>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 animate-scale-in stagger-1">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-orange-500/20 border border-primary/20 flex items-center justify-center mb-4">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Admin Portal
            </h1>
            <p className="text-muted-foreground text-sm">
              Sign in with your admin credentials
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground/80">Admin Email</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@stockastic.com"
                  className="pl-11 h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 rounded-xl transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground/80">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-11 pr-11 h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 rounded-xl transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white border-0 shadow-lg shadow-primary/25 rounded-xl font-medium group transition-all duration-300 hover:-translate-y-0.5"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <>
                  Sign In to Admin
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 divider-glow" />

          {/* Back to User Login */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to User Login
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Admin access is restricted to authorized personnel only.
        </p>
      </div>
    </div>
  );
}
