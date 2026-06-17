import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getStaffMember, resetStaffPassword, updateStaffStatus } from "@/lib/api";
import { formatDate, formatDateTime, formatEnumLabel, initials, userDisplayName } from "@/lib/format";
import { useIsStaff } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, KeyRound, Shield } from "lucide-react";
import { toast } from "sonner";
import { GuvihostApiError } from "@/lib/guvihost-api";

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isStaff = useIsStaff();
  const qc = useQueryClient();
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const staffQuery = useQuery({
    queryKey: ["staff-member", id],
    queryFn: () => getStaffMember(id!),
    enabled: isStaff && Boolean(id),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateStaffStatus(id!, status),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["staff-member", id] });
      qc.invalidateQueries({ queryKey: ["staff-list"] });
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to update status");
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => resetStaffPassword(id!, newPassword),
    onSuccess: () => {
      toast.success("Password reset");
      setResetOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to reset password");
    },
  });

  if (!isStaff) {
    return <PageError message="You must be signed in as staff to view staff details." />;
  }
  if (staffQuery.isLoading) return <PageLoader message="Loading staff member..." />;
  if (staffQuery.isError || !staffQuery.data) {
    return (
      <PageError
        message={
          staffQuery.error instanceof GuvihostApiError
            ? staffQuery.error.message
            : "Failed to load staff member."
        }
      />
    );
  }

  const member = staffQuery.data;
  const name = userDisplayName(member as { firstName?: string; lastName?: string; email?: string });
  const profile = member.staffProfile as { department?: string; employeeCode?: string; jobTitle?: string } | null;
  const ticketCount = (member._count as { assignedTickets?: number } | undefined)?.assignedTickets ?? 0;
  const status = String(member.status ?? "ACTIVE");

  return (
    <AdminLayout>
      <div className="max-w-[900px] mx-auto space-y-6 pb-6 p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <Link to="/staff" className="mt-1 p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-lg">
                {initials(name)}
              </div>
              <div>
                <h1 className="text-[22px] font-bold text-slate-900">{name}</h1>
                <p className="text-sm text-slate-500">{String(member.email ?? "")}</p>
              </div>
              <StatusBadge status={status.toLowerCase()} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoCard label="Role" value={formatEnumLabel(String(member.role ?? "—"))} />
          <InfoCard label="Department" value={profile?.department ?? "—"} />
          <InfoCard label="Employee Code" value={profile?.employeeCode ?? "—"} />
          <InfoCard label="Job Title" value={profile?.jobTitle ?? "—"} />
          <InfoCard label="Open Tickets" value={String(ticketCount)} />
          <InfoCard label="Last Login" value={formatDateTime(String(member.lastLoginAt ?? ""))} />
          <InfoCard label="Joined" value={formatDate(String(member.createdAt ?? ""))} />
          <InfoCard label="Username" value={String(member.username ?? "—")} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 mr-auto">
            <Shield className="h-4 w-4 text-slate-500" />
            <Label className="text-sm text-slate-700">Account Status</Label>
            <select
              value={status}
              disabled={statusMutation.isPending}
              onChange={(e) => statusMutation.mutate(e.target.value)}
              className="h-9 rounded-md border border-slate-200 px-3 text-sm bg-white"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => setResetOpen(true)}>
            <KeyRound className="h-4 w-4" />
            Reset Password
          </Button>
        </div>

        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  minLength={8}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={
                  resetMutation.isPending ||
                  newPassword.length < 8 ||
                  newPassword !== confirmPassword
                }
                onClick={() => resetMutation.mutate()}
              >
                {resetMutation.isPending ? "Resetting..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  );
}
