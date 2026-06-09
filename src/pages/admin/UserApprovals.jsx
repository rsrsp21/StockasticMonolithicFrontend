import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "../../components/ui/skeleton";
import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Check, X, Eye } from "lucide-react";
import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../utils/constants/endpoints";
import { MESSAGES } from "../../utils/constants/messages";
import { toast } from "sonner";
import { Pagination } from "../../components/common/Pagination";
import { usePageTitle } from "../../hooks/usePageTitle";

const PAGE_SIZE = 10;

export default function UserApprovals() {
  usePageTitle("User Approvals");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchPendingKycs = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/kyc/pending", {
        params: { page, size: PAGE_SIZE },
      });
      setPendingUsers(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
      // Use API page number if available, otherwise fallback to requested page
      setCurrentPage(res.data.number !== undefined ? res.data.number : page);
    } catch (err) {
      console.error(err);
      toast.error(MESSAGES.ERROR.ADMIN.KYC_LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingKycs(0);
  }, [fetchPendingKycs]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchPendingKycs(newPage);
  };

  // 🔹 Approve KYC
  const approveKyc = async (userId) => {
    try {
      await axiosInstance.put(`/admin/kyc/${userId}/approve`);
      toast.success(MESSAGES.ADMIN.KYC_APPROVED);
      // Refresh current page
      fetchPendingKycs(currentPage);
    } catch (err) {
      console.error(err);
      toast.error(MESSAGES.ERROR.ADMIN.KYC_APPROVE_FAILED);
    }
  };

  // 🔹 Reject KYC
  const rejectKyc = async (userId) => {
    const reason = prompt("Enter rejection reason");
    if (!reason) return;

    try {
      await axiosInstance.put(`/admin/kyc/${userId}/reject`, {
        reason,
      });
      toast.success(MESSAGES.ADMIN.KYC_REJECTED);
      // Refresh current page
      fetchPendingKycs(currentPage);
    } catch (err) {
      console.error(err);
      toast.error(MESSAGES.ERROR.ADMIN.KYC_REJECT_FAILED);
    }
  };

  // 🔹 View KYC document
  const viewDocument = async (userId) => {
    try {
      const res = await axiosInstance.get(`/admin/kyc/${userId}/document`, {
        responseType: "blob",
      });

      const file = new Blob([res.data], {
        type: res.headers["content-type"],
      });

      const url = URL.createObjectURL(file);
      window.open(url, "_blank");
    } catch (err) {
      console.error(err);
      toast.error(MESSAGES.ERROR.ADMIN.DOC_OPEN_FAILED);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve pending KYC applications
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    User
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    PAN / Aadhaar
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Attempts
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Submitted
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </td>
                      <td className="p-4"><Skeleton className="h-4 w-8" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-16" />
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : pendingUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center">
                      No pending KYC requests
                    </td>
                  </tr>
                ) : (
                  pendingUsers.map((user) => (
                    <tr
                      key={user.userId}
                      className="hover:bg-secondary/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={
                                user.profileImagePath
                                  ? `${API_ENDPOINTS.CONFIG.PROFILE_IMAGE_URL}/${user.profileImagePath}`
                                  : ""
                              }
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {user.name?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground">
                              {user.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="text-sm text-foreground">
                          PAN: {user.panNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Aadhaar: {user.aadhaarNumber}
                        </p>
                      </td>

                      <td className="p-4">
                        <span className="text-sm">{user.attemptCount}</span>
                      </td>

                      <td className="p-4 text-muted-foreground">
                        {new Date(user.submittedAt).toLocaleString()}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewDocument(user.userId)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => approveKyc(user.userId)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => rejectKyc(user.userId)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalElements > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
              isLoading={loading}
              itemLabel="requests"
            />
          )}
        </div>
      </div>
    </>
  );
}