import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "../components/ui/use-toast";

import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { login } from "../services/authService";
import { loginSuccess } from "../store/slices/authSlice";
import { usePageTitle } from "../hooks/usePageTitle";

import logo from "../assets/logo.png";

export default function Login() {
  usePageTitle("Login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, role } = useSelector((state) => state.auth);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (token) {
      // Redirect based on role
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
      const data = await login({ email, password });
      const isAdminLogin = data?.role === "ROLE_ADMIN" || data?.role === "ADMIN";

      // Block admins from normal user login
      if (isAdminLogin) {
        try {
          await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
            method: "POST",
            credentials: "include",
          });
        } catch (logoutErr) {
          console.error("Failed to clear admin session from user login:", logoutErr);
        }

        toast({
          variant: "destructive",
          title: "Use Admin Login",
          description: "Admin accounts must sign in from the Admin Login page.",
        });
        return;
      }

      // Token is now stored in HttpOnly cookie, not localStorage
      dispatch(loginSuccess(data));

      toast({
        title: "Login successful",
        description: "Welcome back 👋",
      });

      navigate("/portfolio");
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      const description =
        apiMessage && typeof apiMessage === "string"
          ? apiMessage
          : "Invalid email or password";

      toast({
        variant: "destructive",
        title: "Login failed",
        description,
      });
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
            <div className="badge-premium inline-flex items-center gap-2 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Welcome back
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Sign in to your account
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground/80">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
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

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot password?
              </Link>
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
                  Sign In
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 divider-glow" />

          {/* Sign Up Link */}
          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Create account
            </Link>
          </div>

          {/* Admin Login Link */}
          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin Login
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to our{" "}
          <Link to="/terms" className="text-primary/80 hover:text-primary">Terms of Service</Link>
          {" "}and{" "}
          <Link to="/privacy" className="text-primary/80 hover:text-primary">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
