import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { BarChart3, Zap, ArrowRight, Sparkles, ChevronRight, Play, PieChart, BellRing, Menu, X, Search, TrendingUp } from "lucide-react";
import { IndexTicker } from "../components/shared/IndexTicker";
import { ThemeToggle } from "../components/shared/ThemeToggle";
import logo from "../assets/logo.png";
import { usePageTitle } from "../hooks/usePageTitle";

export default function Index() {
  usePageTitle("Home");
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated) {
      if (role === "ROLE_ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/portfolio", { replace: true });
      }
    }
  }, [isAuthenticated, role, navigate]);

  const features = [
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time charts with technical indicators, pattern recognition, and AI-powered market analysis.",
    },
    {
      icon: PieChart,
      title: "Smart Portfolio",
      description: "Intelligent portfolio tracking with diversification insights and performance analytics.",
    },
    {
      icon: Zap,
      title: "Lightning Execution",
      description: "Execute trades in milliseconds with our optimized low-latency infrastructure.",
    },
    {
      icon: BellRing,
      title: "Real-time Alerts",
      description: "Get instant notifications for price movements, market news, and your watchlist updates.",
    },
  ];

  const stats = [
    // { value: "2M+", label: "Active Traders" },
    { value: "₹100Cr+", label: "Trading Volume" },
    { value: "99.9%", label: "Uptime" },
    { value: "<10ms", label: "Execution Speed" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="gradient-orb gradient-orb-1 animate-float-large" />
      <div className="gradient-orb gradient-orb-2 animate-float-slower" />

      {/* Noise texture overlay */}
      <div className="noise-bg fixed inset-0 pointer-events-none z-0" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3 animate-fade-in cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="Stockastic Logo" className="h-9 w-9 object-contain" />
            <span className="text-xl font-bold text-foreground tracking-tight">Stockastic</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 animate-fade-in stagger-1">
            <button onClick={() => navigate('/market')} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 cursor-pointer">
              <TrendingUp className="h-4 w-4" /> Market
            </button>
            <button onClick={() => navigate('/explore')} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 cursor-pointer">
              <Search className="h-4 w-4" /> Explore
            </button>
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
              <Zap className="h-4 w-4" /> Features
            </a>
          </nav>

          <div className="flex items-center gap-3 animate-fade-in stagger-2">
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/login")} className="text-sm">
                Login
              </Button>
              <Button
                onClick={() => navigate("/register")}
                className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white border-0 shadow-lg shadow-primary/25"
              >
                Get Started
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 glass-panel bg-background border-b border-white/5 p-4 flex flex-col gap-4 animate-in slide-in-from-top-5">
            <button onClick={() => navigate('/market')} className="text-left text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2 flex items-center gap-3 cursor-pointer">
              <TrendingUp className="h-4 w-4" /> Market Overview
            </button>
            <button onClick={() => navigate('/explore')} className="text-left text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2 flex items-center gap-3 cursor-pointer">
              <Search className="h-4 w-4" /> Explore Stocks
            </button>
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
              <Zap className="h-4 w-4" /> Features
            </a>
            <div className="border-t border-white/10 my-1"></div>
            <div className="flex flex-col gap-3">
              <Button variant="ghost" onClick={() => navigate("/login")} className="w-full justify-start">
                Sign In
              </Button>
              <Button
                onClick={() => navigate("/register")}
                className="w-full bg-gradient-to-r from-primary to-orange-500 text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 lg:px-8">
        <div className="container mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 badge-premium mb-8 animate-fade-in-down">
            <Sparkles className="h-4 w-4" />
            <span>Next-generation trading platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight animate-fade-in-up">
            Trade Smarter with
            <br />
            <span className="gradient-text text-glow animate-gradient-x">Stockastic</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up stagger-1">
            Your all-in-one platform for intelligent stock trading, portfolio management,
            and real-time market analysis. Built for traders who demand excellence.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up stagger-2">
            <Button
              size="lg"
              onClick={() => navigate("/register")}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white border-0 shadow-xl shadow-primary/30 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5 group"
            >
              Start Trading Free
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/explore")}
              className="w-full sm:w-auto bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm group"
            >
              <Search className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              Explore Stocks
            </Button>
          </div>

          {/* Stats Row */}
          <div id="stats" className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto animate-fade-in-up stagger-3">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="glass-card-subtle py-6 px-4 hover-lift"
                style={{ animationDelay: `${0.4 + i * 0.1}s` }}
              >
                <div className="text-2xl md:text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-slow hidden md:flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer z-10" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
            <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Scroll</span>
            <ArrowRight className="h-4 w-4 rotate-90 text-primary" />
          </div>
        </div>
      </section>

      {/* Live Ticker */}
      <div className="py-4 border-y border-white/5 glass-panel">
        <IndexTicker />
      </div>


      {/* Features Section */}
      <section id="features" className="relative py-24 px-4 lg:px-8">
        <div className="container mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="badge-premium inline-flex items-center gap-2 mb-4">
              <Zap className="h-3.5 w-3.5" />
              Features
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Why Choose <span className="gradient-text">Stockastic</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Powerful features designed to give you the competitive edge in trading
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="glass-card p-6 hover-lift group cursor-pointer"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="feature-icon mb-5 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>

              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="relative py-10 px-4 lg:px-8 border-t border-white/5">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Stockastic Logo" className="h-7 w-7 object-contain opacity-80" />
              <span className="font-semibold text-foreground/80">Stockastic</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">Privacy</button>
              <button onClick={() => navigate('/terms')} className="hover:text-foreground transition-colors">Terms</button>
              <button onClick={() => navigate('/support')} className="hover:text-foreground transition-colors">Support</button>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Stockastic. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
