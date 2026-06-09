import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "../components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import logo from "../assets/logo.png";
import { usePageTitle } from "../hooks/usePageTitle";

const NotFound = () => {
  usePageTitle("Page Not Found");
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="gradient-orb gradient-orb-1" />
      <div className="gradient-orb gradient-orb-2" />

      {/* Noise texture overlay */}
      <div className="noise-bg fixed inset-0 pointer-events-none z-0" />

      <div className="relative z-10 text-center animate-fade-in-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <img src={logo} alt="Stockastic Logo" className="h-10 w-10 object-contain" />
          <span className="text-xl font-bold tracking-tight">Stockastic</span>
        </div>

        {/* 404 Display */}
        <div className="glass-card p-12 max-w-lg mx-auto">
          {/* Animated 404 */}
          <div className="relative mb-8">
            <div className="text-[120px] md:text-[160px] font-bold leading-none gradient-text text-glow">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-24 w-24 rounded-full bg-primary/10 animate-pulse-glow" />
            </div>
          </div>

          {/* Message */}
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Page Not Found
          </h1>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved to a different location.
          </p>

          {/* Attempted Path */}
          <div className="glass-card-subtle p-3 rounded-lg mb-8 inline-block">
            <code className="text-sm text-muted-foreground font-mono">
              {location.pathname}
            </code>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="w-full sm:w-auto">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/portfolio">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Portfolio
              </Link>
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-muted-foreground">
          Need help?{" "}
          <a href="#" className="text-primary hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
