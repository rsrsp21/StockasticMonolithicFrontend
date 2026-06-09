import { NavLink } from "../components/common/NavLink";
import logo from "../assets/logo.png";
import {
  LayoutDashboard,
  TrendingUp,
  Search,
  Star,
  Briefcase,
  FileText,
  Wallet,
  Bell,
  Shield,
  X,
  CalendarClock,
  GitCompare,
  Activity,
  BellRing,
  Zap,
  ChevronRight,
  Package,
  Users2,
} from "lucide-react";
import { cn } from "../utils/utils";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

// Navigation items
const userNavItems = [
  { icon: LayoutDashboard, label: "Portfolio", path: "/portfolio", end: true },
  { icon: TrendingUp, label: "Market", path: "/market" },
  { icon: Search, label: "Explore", path: "/explore" },
  { icon: GitCompare, label: "Compare", path: "/compare" },
  // { icon: Activity, label: "Indicators", path: "/indicators" },
  { icon: Star, label: "Watchlists", path: "/watchlist" },
  { icon: BellRing, label: "Price Alerts", path: "/alerts" },
  { icon: Briefcase, label: "Holdings", path: "/holdings" },
  { icon: Zap, label: "Auto-Sell", path: "/auto-sell" },
  { icon: CalendarClock, label: "SIP", path: "/sip" },
  { icon: Wallet, label: "Wallet", path: "/wallet" },
  { icon: FileText, label: "Reports", path: "/reports" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
];

// Admin navigation items
const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin", end: true },
  { icon: TrendingUp, label: "Market", path: "/admin/market" },
  { icon: Search, label: "Explore", path: "/explore" },
  { icon: Shield, label: "User Approvals", path: "/admin/approvals" },
  { icon: Package, label: "Manage Stocks", path: "/admin/manage-stocks" },
  { icon: Users2, label: "Manage Users", path: "/admin/manage-users" },
  { icon: Activity, label: "System Health", path: "/admin/system-health" },
];

// Nav Section Component
function NavSection({ title, items, onNavClick }) {
  return (
    <div className="mb-6">
      {title && (
        <div className="px-3 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            {title}
          </span>
        </div>
      )}
      <div className="space-y-1">
        {items.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onNavClick}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-muted/40"
            )}
            activeClassName="!bg-gradient-to-r !from-primary/20 !to-primary/5 !text-primary !border-l-[3px] !border-primary"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <item.icon className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-50 group-hover:translate-x-0" />
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export function Sidebar({ isAdmin = false, isOpen = true, isCollapsed = false, onClose }) {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Define nav items based on auth state
  let navItems;
  if (isAdmin) {
    navItems = adminNavItems;
  } else if (user) {
    navItems = userNavItems;
  } else {
    // Guest User: Only Market and Explore
    navItems = userNavItems.filter(item => ["/market", "/explore"].includes(item.path));
  }

  // Split nav items into sections for better organization
  const mainNavItems = navItems.slice(0, 6);
  const tradingNavItems = navItems.slice(6, 10);
  const accountNavItems = navItems.slice(10);
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72 glass-panel border-r border-border/30 transition-transform duration-300 ease-out",
          // Desktop: hide when collapsed
          isCollapsed ? "lg:-translate-x-full" : "lg:translate-x-0",
          // Mobile: show/hide based on isOpen
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo Header */}
          <div className="flex h-16 items-center justify-between border-b border-border/30 px-6">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate(isAdmin ? "/admin" : (user ? "/portfolio" : "/"))}
            >
              <img
                src={logo}
                alt="Stockastic Logo"
                className="h-9 w-9 object-contain"
              />
              <span className="text-xl font-bold text-foreground tracking-tight">
                Stockastic
              </span>
            </div>

            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-thin">
            {isAdmin ? (
              <NavSection items={navItems} onNavClick={onClose} />
            ) : (
              <>
                <>
                  <NavSection title="Overview" items={mainNavItems.filter(item => navItems.includes(item))} onNavClick={onClose} />
                  {user && <NavSection title="Trading" items={tradingNavItems} onNavClick={onClose} />}
                  {user && <NavSection title="Account" items={accountNavItems} onNavClick={onClose} />}
                </>
              </>
            )}
          </nav>

          {/* Guest User Banner */}
          {!user && !isAdmin && (
            <div className="p-4 mx-4 mb-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <p className="text-sm font-medium mb-1 text-foreground">Unlock all features</p>
              <p className="text-xs text-muted-foreground mb-3">Login to manage your portfolio, trade stocks, and more.</p>
              <a
                href="/login"
                className="block w-full text-center py-2 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                onClick={(e) => { e.preventDefault(); onClose && onClose(); window.location.href = '/login'; }}
              >
                Login Now
              </a>
            </div>
          )}

        </div>
      </aside>
    </>
  );
}
