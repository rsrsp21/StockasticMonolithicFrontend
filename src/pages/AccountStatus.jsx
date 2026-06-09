import { Link } from "react-router-dom";
import { Clock, CheckCircle, XCircle, ArrowLeft, Mail, FileText } from "lucide-react";
import { Button } from "../components/ui/button";
import logo from "../assets/logo.png";
import { usePageTitle } from "../hooks/usePageTitle";

export default function AccountStatus() {
  usePageTitle("Account Status");
  // Demo: Show pending status
  const status = "pending";

  const statusConfig = {
    pending: {
      icon: Clock,
      title: "Application Under Review",
      description: "Your KYC documents are being verified by our team. This usually takes 1-2 business days.",
      color: "text-yellow-400",
      bgGradient: "from-yellow-400/20 to-orange-400/20",
      borderColor: "border-yellow-400/30",
      iconBg: "bg-yellow-400/10",
      glowColor: "shadow-[0_0_30px_rgba(251,191,36,0.2)]",
    },
    approved: {
      icon: CheckCircle,
      title: "Account Approved!",
      description: "Congratulations! Your account has been verified and approved. You can now start trading.",
      color: "text-green-400",
      bgGradient: "from-green-400/20 to-emerald-400/20",
      borderColor: "border-green-400/30",
      iconBg: "bg-green-400/10",
      glowColor: "shadow-[0_0_30px_rgba(74,222,128,0.2)]",
    },
    rejected: {
      icon: XCircle,
      title: "Application Not Approved",
      description: "Unfortunately, we couldn't verify your documents. Please contact our support team for assistance.",
      color: "text-red-400",
      bgGradient: "from-red-400/20 to-rose-400/20",
      borderColor: "border-red-400/30",
      iconBg: "bg-red-400/10",
      glowColor: "shadow-[0_0_30px_rgba(248,113,113,0.2)]",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="gradient-orb gradient-orb-1" />
      <div className="gradient-orb gradient-orb-2" />

      {/* Noise texture overlay */}
      <div className="noise-bg fixed inset-0 pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src={logo} alt="Stockastic Logo" className="h-12 w-12 object-contain" />
          <span className="text-2xl font-bold tracking-tight">Stockastic</span>
        </div>

        {/* Status Card */}
        <div className={`glass-card p-8 text-center border ${config.borderColor} ${config.glowColor}`}>
          {/* Status Icon */}
          <div className={`mx-auto w-20 h-20 rounded-2xl ${config.iconBg} flex items-center justify-center mb-6 animate-scale-in`}>
            <Icon className={`h-10 w-10 ${config.color}`} />
          </div>

          {/* Title & Description */}
          <h1 className="text-2xl font-bold text-foreground mb-3">{config.title}</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">{config.description}</p>

          {/* Application Details */}
          <div className="glass-card-subtle rounded-xl p-4 mb-6 text-left space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Application ID
              </span>
              <span className="font-mono font-medium text-foreground">APP-2024-12345</span>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Submitted
              </span>
              <span className="font-medium text-foreground">December 15, 2024</span>
            </div>
          </div>

          {/* Email Notification Notice */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
            <Mail className="h-4 w-4" />
            <span>We'll notify you via email once reviewed</span>
          </div>

          {/* Action Buttons */}
          {status === "approved" ? (
            <Button asChild className="w-full">
              <Link to="/portfolio">
                Go to Portfolio
              </Link>
            </Button>
          ) : status === "rejected" ? (
            <Button asChild className="w-full">
              <a href="mailto:support@stockastic.com">
                Contact Support
              </a>
            </Button>
          ) : (
            <Button variant="outline" asChild className="w-full">
              <Link to="/">
                Return to Homepage
              </Link>
            </Button>
          )}
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
