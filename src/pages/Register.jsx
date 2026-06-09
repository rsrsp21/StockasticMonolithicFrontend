import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { MESSAGES } from "../utils/constants/messages";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Sparkles, Check, X } from "lucide-react";
import { register } from "../services/authService";
import { toast } from "sonner";
import logo from "../assets/logo.png";
import { cn } from "../utils/utils";
import { usePageTitle } from "../hooks/usePageTitle";

export default function Register() {
  usePageTitle("Create Account");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { token, role } = useSelector((state) => state.auth);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (token) {
      if (role === "ROLE_ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/portfolio", { replace: true });
      }
    }
  }, [token, role, navigate]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // Password strength checker
  const getPasswordStrength = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };
    const strength = Object.values(checks).filter(Boolean).length;
    return { checks, strength };
  };

  const { checks: passwordChecks, strength: passwordStrength } = getPasswordStrength(formData.password);

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-orange-500";
    if (passwordStrength <= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const validateForm = () => {
    const { name, email, mobile, password } = formData;

    if (!/^[A-Za-z ]{3,}$/.test(name)) {
      toast.error(MESSAGES.VALIDATION.NAME_LENGTH);
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(MESSAGES.VALIDATION.EMAIL_INVALID);
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast.error(MESSAGES.VALIDATION.PHONE_INVALID);
      return false;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}/.test(password)) {
      toast.error(MESSAGES.VALIDATION.PASSWORD_REQ);
      return false;
    }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register(formData);
      toast.success(MESSAGES.SUCCESS.AUTH.REGISTERED);
      navigate("/login");
    } catch (error) {
      console.error(error);
      toast.error(MESSAGES.ERROR.AUTH.REGISTER_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 py-12 overflow-hidden">
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
          <span className="text-2xl font-bold tracking-tight">Stockastic</span>
        </div>

        {/* Register Card */}
        <div className="glass-card p-8 animate-scale-in stagger-1">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="badge-premium inline-flex items-center gap-2 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Join Stockastic
            </div>
            <h1 className="text-2xl font-bold mb-2">Create your account</h1>
            <p className="text-muted-foreground text-sm">
              Start trading in minutes with a free account
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground/80">Full Name</Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="pl-11 h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 rounded-xl transition-all duration-200"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/80">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-11 h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 rounded-xl transition-all duration-200"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-sm font-medium text-foreground/80">Phone Number</Label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="9876543210"
                  className="pl-11 h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 rounded-xl transition-all duration-200"
                  value={formData.mobile}
                  onChange={handleChange}
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/80">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className="pl-11 pr-11 h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 rounded-xl transition-all duration-200"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-3 pt-2 animate-fade-in">
                  {/* Strength Bar */}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors duration-300",
                          passwordStrength >= level ? getStrengthColor() : "bg-white/10"
                        )}
                      />
                    ))}
                  </div>

                  {/* Requirements List */}
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {[
                      { key: "length", label: "8+ characters" },
                      { key: "uppercase", label: "Uppercase" },
                      { key: "lowercase", label: "Lowercase" },
                      { key: "number", label: "Number" },
                      { key: "special", label: "Symbol (@$!%*?&)" },
                    ].map((req) => (
                      <div
                        key={req.key}
                        className={cn(
                          "flex items-center gap-1.5 transition-colors",
                          passwordChecks[req.key] ? "text-green-400" : "text-muted-foreground"
                        )}
                      >
                        {passwordChecks[req.key] ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        {req.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  Creating account...
                </div>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 divider-glow" />

          {/* Sign In Link */}
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By creating an account, you agree to our{" "}
          <Link to="/terms" className="text-primary/80 hover:text-primary">Terms of Service</Link>
          {" "}and{" "}
          <Link to="/privacy" className="text-primary/80 hover:text-primary">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}