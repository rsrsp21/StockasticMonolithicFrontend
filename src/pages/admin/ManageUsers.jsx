import { useEffect, useState, useCallback, useRef } from "react";
import { Skeleton } from "../../components/ui/skeleton";
import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import {
    Search,
    ShieldBan,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Users,
    UserCheck,
    UserX,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../utils/constants/endpoints";
import { MESSAGES } from "../../utils/constants/messages";
import { toast } from "sonner";
import { usePageTitle } from "../../hooks/usePageTitle";
import { RefreshButton } from "../../components/common/RefreshButton";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
    { value: "", label: "All Status" },
    { value: "ACTIVE", label: "Active" },
    { value: "BLOCKED", label: "Blocked" },
];

export default function ManageUsers() {
    usePageTitle("Manage Users");

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const [searchInput, setSearchInput] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize, setPageSize] = useState(PAGE_SIZE);

    const [sortBy, setSortBy] = useState("");
    const [sortDir, setSortDir] = useState("asc");

    const searchInputRef = useRef(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                size: PAGE_SIZE,
            };

            if (appliedSearch) params.search = appliedSearch;
            if (statusFilter) params.status = statusFilter;
            if (sortBy) {
                params.sortBy = sortBy;
                params.sortDir = sortDir;
            }

            const res = await axiosInstance.get(API_ENDPOINTS.ADMIN.USERS.PAGED, { params });
            const data = res.data || {};

            setUsers(data.users || []);
            setTotalElements(data.totalElements || 0);
            setPageSize(data.pageSize || PAGE_SIZE);
        } catch (err) {
            console.error(err);
            toast.error(MESSAGES.ERROR.ADMIN.USERS_LOAD_FAILED);
        } finally {
            setLoading(false);
        }
    }, [currentPage, appliedSearch, statusFilter, sortBy, sortDir]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearch = () => {
        setAppliedSearch(searchInput.trim());
        setCurrentPage(0);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") handleSearch();
    };

    const handleClearSearch = () => {
        setSearchInput("");
        setAppliedSearch("");
        setCurrentPage(0);
    };

    const handleStatusChange = (newStatus) => {
        setStatusFilter(newStatus);
        setCurrentPage(0);
    };

    const handleRefresh = () => {
        fetchUsers();
    };

    const handleSortChange = (columnKey) => {
        if (sortBy === columnKey) {
            setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
            setCurrentPage(0);
            return;
        }
        setSortBy(columnKey);
        setSortDir("desc");
        setCurrentPage(0);
    };

    const renderSortHeader = (label, columnKey, align = "left") => {
        const isActive = sortBy === columnKey;
        const isAsc = sortDir === "asc";

        return (
            <button
                type="button"
                onClick={() => handleSortChange(columnKey)}
                className={`inline-flex items-center gap-1.5 hover:text-foreground transition-colors ${align === "right" ? "ml-auto" : ""}`}
                title={`Sort by ${label}`}
            >
                <span>{label}</span>
                {isActive ? (
                    isAsc ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                ) : (
                    <ArrowUp className="h-3.5 w-3.5 opacity-30" />
                )}
            </button>
        );
    };

    const totalPages = totalElements > 0 ? Math.ceil(totalElements / pageSize) : 0;
    const currentPageNum = totalElements > 0 ? currentPage + 1 : 0;
    const showingFrom = totalElements > 0 ? currentPage * pageSize + 1 : 0;
    const showingTo = totalElements > 0 ? Math.min(showingFrom + users.length - 1, totalElements) : 0;

    const handleNextPage = () => {
        if (currentPage + 1 >= totalPages) return;
        setCurrentPage((prev) => prev + 1);
    };

    const handlePrevPage = () => {
        if (currentPage <= 0) return;
        setCurrentPage((prev) => prev - 1);
    };

    const handleBlock = async (userId) => {
        setActionLoading(userId);
        try {
            await axiosInstance.put(API_ENDPOINTS.ADMIN.USERS.BLOCK(userId));
            toast.success(MESSAGES.ADMIN.USER_BLOCKED);
            setUsers((prev) => prev.map((u) => (u.userId === userId ? { ...u, status: "BLOCKED" } : u)));
        } catch (err) {
            console.error(err);
            toast.error(MESSAGES.ERROR.ADMIN.USER_BLOCK_FAILED);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnblock = async (userId) => {
        setActionLoading(userId);
        try {
            await axiosInstance.put(API_ENDPOINTS.ADMIN.USERS.UNBLOCK(userId));
            toast.success(MESSAGES.ADMIN.USER_UNBLOCKED);
            setUsers((prev) => prev.map((u) => (u.userId === userId ? { ...u, status: "ACTIVE" } : u)));
        } catch (err) {
            console.error(err);
            toast.error(MESSAGES.ERROR.ADMIN.USER_UNBLOCK_FAILED);
        } finally {
            setActionLoading(null);
        }
    };

    const StatusBadge = ({ status }) => {
        const isActive = status === "ACTIVE";
        const isBlocked = status === "BLOCKED";
        return (
            <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide
        ${isActive ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : ""}
        ${isBlocked ? "bg-red-500/15 text-red-400 border border-red-500/20" : ""}
        ${!isActive && !isBlocked ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20" : ""}
      `}
            >
                <span
                    className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-400" : isBlocked ? "bg-red-400" : "bg-yellow-400"}`}
                />
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Manage Users</h1>
                    <p className="text-muted-foreground">
                        View and manage all user accounts
                        {totalElements > 0 && (
                            <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {totalElements.toLocaleString()} users
                            </span>
                        )}
                    </p>
                </div>
                <RefreshButton onClick={handleRefresh} isLoading={loading} />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 h-4 w-4 text-foreground/55" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        {searchInput && (
                            <button
                                onClick={handleClearSearch}
                                className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Clear
                            </button>
                        )}
                        <Button size="sm" variant="ghost" onClick={handleSearch} className="h-7 px-2">
                            Search
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border">
                    {STATUS_OPTIONS.map((opt) => {
                        const isSelected = statusFilter === opt.value;
                        let activeClasses = "";
                        if (isSelected && opt.value === "") activeClasses = "bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-sm";
                        else if (isSelected && opt.value === "ACTIVE") activeClasses = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-sm";
                        else if (isSelected && opt.value === "BLOCKED") activeClasses = "bg-red-500/15 text-red-400 border-red-500/30 shadow-sm";

                        return (
                            <button
                                key={opt.value}
                                onClick={() => handleStatusChange(opt.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer whitespace-nowrap
                                    ${isSelected
                                        ? activeClasses
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {!loading && totalElements > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{totalElements.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Total Users</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {users.filter((u) => u.status === "ACTIVE").length}
                            </p>
                            <p className="text-xs text-muted-foreground">Active (this page)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                        <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <UserX className="h-5 w-5 text-red-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {users.filter((u) => u.status === "BLOCKED").length}
                            </p>
                            <p className="text-xs text-muted-foreground">Blocked (this page)</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-secondary/30">
                                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {renderSortHeader("User", "name")}
                                </th>
                                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {renderSortHeader("Mobile", "mobile")}
                                </th>
                                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {renderSortHeader("Status", "status")}
                                </th>
                                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {renderSortHeader("Joined", "createdAt")}
                                </th>
                                <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-border">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-48" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="p-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                        <td className="p-4"><Skeleton className="h-4 w-28" /></td>
                                        <td className="p-4">
                                            <div className="flex justify-end">
                                                <Skeleton className="h-8 w-20" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Users className="h-12 w-12 text-muted-foreground/30" />
                                            <p className="text-muted-foreground font-medium">No users found</p>
                                            {appliedSearch && (
                                                <p className="text-sm text-muted-foreground/60">
                                                    Try a different search term
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr
                                        key={user.userId}
                                        className="hover:bg-secondary/20 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 ring-2 ring-border">
                                                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-sm font-semibold">
                                                        {user.name?.charAt(0)?.toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-foreground truncate">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <span className="text-sm text-foreground font-mono">
                                                {user.mobile || "-"}
                                            </span>
                                        </td>

                                        <td className="p-4">
                                            <StatusBadge status={user.status} />
                                        </td>

                                        <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                                            {user.createdAt
                                                ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })
                                                : "-"}
                                        </td>

                                        <td className="p-4">
                                            <div className="flex items-center justify-end">
                                                {user.status === "ACTIVE" ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30"
                                                        onClick={() => handleBlock(user.userId)}
                                                        disabled={actionLoading === user.userId}
                                                    >
                                                        <ShieldBan className="h-4 w-4 mr-1.5" />
                                                        {actionLoading === user.userId ? "Blocking..." : "Block"}
                                                    </Button>
                                                ) : user.status === "BLOCKED" ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30"
                                                        onClick={() => handleUnblock(user.userId)}
                                                        disabled={actionLoading === user.userId}
                                                    >
                                                        <ShieldCheck className="h-4 w-4 mr-1.5" />
                                                        {actionLoading === user.userId ? "Unblocking..." : "Unblock"}
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalElements > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/10">
                        <p className="text-sm text-muted-foreground">
                            Showing <span className="font-medium text-foreground">{showingFrom}</span>
                            {" - "}
                            <span className="font-medium text-foreground">{showingTo}</span>
                            {" of "}
                            <span className="font-medium text-foreground">{totalElements.toLocaleString()}</span>
                            {" users"}
                        </p>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrevPage}
                                disabled={currentPage <= 0 || loading}
                                className="h-8 px-3"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>

                            <span className="text-sm text-muted-foreground px-2">
                                Page {currentPageNum}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={currentPage + 1 >= totalPages || loading}
                                className="h-8 px-3"
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
