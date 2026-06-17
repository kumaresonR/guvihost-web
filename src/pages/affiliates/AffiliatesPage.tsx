import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PageLoader, PageError } from "@/components/PageLoader";
import { getAffiliateDashboard, listReferrals } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { useIsClient } from "@/hooks/use-role";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Users, IndianRupee, Link2 } from "lucide-react";
import { toast } from "sonner";
import { GuvihostApiError } from "@/lib/guvihost-api";

const PER_PAGE = 10;

type ReferralRow = Record<string, unknown> & { id: string };

export default function AffiliatesPage() {
  const isClient = useIsClient();
  const [page, setPage] = useState(1);

  const dashboardQuery = useQuery({
    queryKey: ["affiliate-dashboard"],
    queryFn: getAffiliateDashboard,
    enabled: isClient,
  });

  const referralsQuery = useQuery({
    queryKey: ["affiliate-referrals", page],
    queryFn: () => listReferrals({ page, limit: PER_PAGE }),
    enabled: isClient,
  });

  if (!isClient) {
    return <PageError message="You must be signed in as a client to view the affiliate program." />;
  }
  if (dashboardQuery.isLoading) return <PageLoader message="Loading affiliate dashboard..." />;
  if (dashboardQuery.isError) {
    return (
      <PageError
        message={
          dashboardQuery.error instanceof GuvihostApiError
            ? dashboardQuery.error.message
            : "Failed to load affiliate dashboard."
        }
      />
    );
  }

  const dash = dashboardQuery.data ?? {};
  const referralLink = `${window.location.origin}${String(dash.referralLink ?? "")}`;
  const items = (referralsQuery.data?.items ?? []) as ReferralRow[];
  const pagination = referralsQuery.data?.pagination ?? {
    page: 1,
    limit: PER_PAGE,
    total: 0,
    totalPages: 1,
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied");
  };

  const columns = [
    {
      key: "email",
      label: "Referred Email",
      render: (row: ReferralRow) => (
        <span className="text-sm text-slate-700">{String(row.referredEmail ?? "—")}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: ReferralRow) => (
        <StatusBadge status={String(row.status ?? "").toLowerCase()} />
      ),
    },
    {
      key: "commission",
      label: "Commission",
      render: (row: ReferralRow) => (
        <span className="text-sm font-medium">{formatCurrency(Number(row.commissionAmount ?? 0))}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (row: ReferralRow) => (
        <span className="text-xs text-slate-500">{formatDate(String(row.createdAt ?? ""))}</span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto space-y-6 pb-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Affiliate Program
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Share your referral link and earn {Number(dash.commissionRate ?? 0)}% commission.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard label="Total Referrals" value={Number(dash.totalReferrals ?? 0)} icon={Users} />
          <MetricCard label="Converted" value={Number(dash.convertedReferrals ?? 0)} icon={Link2} />
          <MetricCard label="Total Earnings" value={formatCurrency(Number(dash.totalEarnings ?? 0))} icon={IndianRupee} />
          <MetricCard label="Pending Earnings" value={formatCurrency(Number(dash.pendingEarnings ?? 0))} icon={IndianRupee} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
          <Label className="text-sm text-slate-700">Your Referral Link</Label>
          <div className="flex gap-2">
            <Input readOnly value={referralLink} className="font-mono text-sm" />
            <Button variant="outline" className="gap-2 shrink-0" onClick={copyLink}>
              <Copy className="h-4 w-4" /> Copy
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Referral code: <strong>{String(dash.referralCode ?? "—")}</strong>
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-800 mb-3">Referral History</h2>
          {referralsQuery.isLoading ? (
            <PageLoader message="Loading referrals..." />
          ) : (
            <DataTable
              columns={columns}
              data={items}
              total={pagination.total}
              page={pagination.page}
              perPage={pagination.limit}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
              showDateFilter={false}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
