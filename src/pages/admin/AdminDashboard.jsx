import { useEffect, useState } from "react";
import { Skeleton } from "../../components/ui/skeleton";
import { MetricCard } from "../../components/shared/MetricCard";
import { Users, TrendingUp, DollarSign, Activity, Clock, CheckCircle, XCircle, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "../../services/adminService";
import { toast } from "sonner";
import { MESSAGES } from "../../utils/constants/messages";
import { usePageTitle } from "../../hooks/usePageTitle";

export default function AdminDashboard() {
  usePageTitle("Admin Dashboard");
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    kycApproved: 0,
    kycRejected: 0,
    kycPending: 0,
    totalStocks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
        toast.error(MESSAGES.ERROR.ADMIN.DASHBOARD_LOAD_FAILED);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and analytics</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Users"
            value={loading ? <Skeleton className="h-8 w-24" /> : stats.totalUsers.toLocaleString()}
            change="Total registered"
            changeType="neutral"
            icon={Users}
          />
          <MetricCard
            title="Total Stocks"
            value={loading ? <Skeleton className="h-8 w-24" /> : stats.totalStocks.toLocaleString()}
            change="Listed stocks"
            changeType="neutral"
            icon={Package}
          />
          {/* Placeholders for future stats */}
          {/* <MetricCard title="Trading Volume" value="$12.5M" change="+15.3% from last week" changeType="positive" icon={TrendingUp}/> */}
          {/* <MetricCard title="Revenue" value="$84,250" change="+8.2% MTD" changeType="positive" icon={DollarSign}/> */}
        </div>

        {/* KYC Overview */}
        <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">KYC Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => navigate("/admin/approvals")}
            className="rounded-lg border border-border bg-card p-5 hover:border-primary/50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-400/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {loading ? <Skeleton className="h-8 w-16 bg-foreground/10" /> : stats.kycPending.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-400/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {loading ? <Skeleton className="h-8 w-16 bg-foreground/10" /> : stats.kycApproved.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Approved Users</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-400/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? "..." : stats.kycRejected.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Rejected Users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Area - Keeping structure for future implementation */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 
                </div> */}
      </div>
    </>
  );
}

/*
Now we will do sip, for sip only monthly and yearly are there
conditions:
1. it should happen same day of the month, if the day is 31 and month has only 30 days then it should happen on 30th
2. if the day is 29 and month is february then it should happen on 28th
3. if the same day is holiday/weekend then it should happen on next immediate working day and only during market work hours with opening price at 9:15 am, if market is closed on that day then it should happen on next immediate working day with opening price at 9:15 am
4. if the user has insufficient balance on the day of sip then it should be skipped for that month and user should be notified about it, and next sip should happen on next month same day with same amount
5. user should be able to pause and resume sip at any time, if paused then next sip should happen on next month same day with same amount, if resumed then next sip should happen on next month same day with same amount
6. user can select only quanitity for sip, price will be determined on the day of sip based on opening price at 9:15 am, if market is closed on that day then price will be determined on next immediate working day based on opening price at 9:15 am
7. user should be able to see the history of all sip transactions with details like date, quantity, price, total amount, status (completed, skipped, paused) and reason for skipped/paused if applicable
8. user should receive notifications for upcoming sip, successful sip, skipped sip and paused sip with relevant details and reasons if applicable
9. user should be able to cancel sip at any time, if cancelled then no further sip should happen and user should be notified about it
10. user should be able to modify sip details like quantity and next sip date, if modified then next sip should happen based on the new details and user should be notified about the changes
11. yearly sip should happen on the same day of the year, if the day is 29 and month is february then it should happen on 28th, if the same day is holiday/weekend then it should happen on next immediate working day and only during market work hours with opening price at 9:15 am, if market is closed on that day then it should happen on next immediate working day with opening price at 9:15 am, if user has insufficient balance on the day of sip then it should be skipped for that year and user should be notified about it, and next sip should happen on next year same day with same amount
these are the conditions for sip, we will implement these conditions in the backend and frontend accordingly, we will also create a separate page for managing sip where user can see all their sip details and perform actions like pause, resume, cancel and modify sip.
use existing market hours service in backend to check for market hours and holidays, use existing notification service to send notifications to users about their sip transactions and updates, use existing transaction history service to log all sip transactions with relevant details and status.
sip has only buy option, no sell option, user can only select quantity for sip, price will be determined on the day of sip based on opening price at 9:15 am, if market is closed on that day then price will be determined on next immediate working day based on opening price at 9:15 am, user should be able to see the history of all sip transactions with details like date, quantity, price, total amount, status (completed, skipped, paused) and reason for skipped/paused if applicable, user should receive notifications for upcoming sip, successful sip, skipped sip and paused sip with relevant details and reasons if applicable, user should be able to cancel sip at any time, if cancelled then no further sip should happen and user should be notified about it, user should be able to modify sip details like quantity and next sip date, if modified then next sip should happen based on the new details and user should be notified about the changes.
*/
