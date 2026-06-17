import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { getClientStats, listClients, exportClientsCsv } from "@/lib/api";
import { downloadTextFile } from "@/lib/download";
import { formatDate, formatEnumLabel, initials, userDisplayName } from "@/lib/format";
import { GuvihostApiError } from "@/lib/guvihost-api";
import { useIsStaff } from "@/hooks/use-role";
import { toast } from "sonner";
import {
  Users,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ShieldX,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

type ClientRow = {
  id: string;
  clientCode: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  status: string;
  kycStatus: string;
  createdAt: string;
};

export default function AllClientsPage() {
  const isStaff = useIsStaff();
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    kycVerified: number;
    kycUnverified: number;
  } | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [kycFilter, setKycFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const csv = await exportClientsCsv();
      downloadTextFile(csv, `clients-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success("Clients exported");
    } catch (e) {
      toast.error(e instanceof GuvihostApiError ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPagination((p) => ({ ...p, page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, listRes] = await Promise.all([
        getClientStats(),
        listClients({
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
          kycStatus: kycFilter || undefined,
        }),
      ]);
      setStats(statsRes);
      setClients(listRes.items as ClientRow[]);
      setPagination(listRes.pagination);
    } catch (e) {
      const msg = e instanceof GuvihostApiError ? e.message : "Failed to load clients";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, statusFilter, kycFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleKycFilter = (value: string) => {
    setKycFilter(value);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  if (!isStaff) {
    return <PageError message="You must be signed in as staff to view clients." />;
  }
  if (loading && !stats) return <PageLoader message="Loading clients..." />;
  if (error && !stats) return <PageError message={error} />;

  const kpiCards = [
    { title: "Total Clients", value: stats?.total ?? 0, icon: Users, iconBg: "bg-blue-500" },
    { title: "Active Clients", value: stats?.active ?? 0, icon: FileText, iconBg: "bg-emerald-500" },
    { title: "Inactive Clients", value: stats?.inactive ?? 0, icon: ShieldX, iconBg: "bg-rose-500" },
    { title: "KYC Verified", value: stats?.kycVerified ?? 0, icon: ShieldCheck, iconBg: "bg-teal-500" },
    { title: "Unverified KYC", value: stats?.kycUnverified ?? 0, icon: ShieldAlert, iconBg: "bg-rose-500" },
  ];

  const from = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const to = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <AdminLayout>
      <div className="bg-[#ffffff] min-h-full p-4 sm:p-6 font-sans">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-[24px] font-bold text-[#0a1b3f] tracking-tight">All Clients</h1>
            <p className="text-[14px] text-slate-500 mt-1">Manage and view all your clients in one place.</p>
          </div>
          <Link
            to="/clients/add"
            className="flex items-center gap-2 bg-[#1b5df9] hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus size={18} strokeWidth={2.5} />
            Add Client
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {kpiCards.map((card) => (
            <div key={card.title} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3 shadow-sm ${card.iconBg}`}>
                <card.icon size={22} strokeWidth={2.5} />
              </div>
              <p className="text-[12px] font-semibold text-slate-500 mb-1">{card.title}</p>
              <h3 className="text-[22px] font-bold text-[#0a1b3f]">{card.value.toLocaleString()}</h3>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-64 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-700 placeholder:text-slate-400"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white min-w-[120px]"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
              <select
                value={kycFilter}
                onChange={(e) => handleKycFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white min-w-[140px]"
              >
                <option value="">All KYC Status</option>
                <option value="VERIFIED">Verified</option>
                <option value="PENDING">Pending</option>
                <option value="UNVERIFIED">Unverified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
              <button type="button" className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium">
                <Filter size={16} /> Filter
              </button>
              <button
                type="button"
                disabled={exporting}
                onClick={handleExportCsv}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                <Download size={16} /> {exporting ? "Exporting..." : "Export CSV"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Phone</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Company</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">KYC Status</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Joined On</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm text-slate-500">Loading...</td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm text-slate-500">No clients found.</td>
                  </tr>
                ) : (
                  clients.map((client) => {
                    const name = userDisplayName(client);
                    return (
                      <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm shrink-0">
                              {initials(name)}
                            </div>
                            <div>
                              <p className="text-[14px] font-bold text-[#0a1b3f]">{name}</p>
                              <p className="text-[12px] text-slate-500">{client.clientCode ?? "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-[13px] text-slate-600 font-medium">{client.email}</td>
                        <td className="py-3 px-6 text-[13px] text-slate-600 font-medium">{client.phone ?? "—"}</td>
                        <td className="py-3 px-6 text-[13px] text-slate-600 font-medium">{client.company ?? "—"}</td>
                        <td className="py-3 px-6">
                          <StatusBadge status={client.status} />
                        </td>
                        <td className="py-3 px-6">
                          <KycBadge status={client.kycStatus} />
                        </td>
                        <td className="py-3 px-6 text-[13px] text-slate-600 font-medium whitespace-nowrap">
                          {formatDate(client.createdAt)}
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="View">
                              <Eye size={16} />
                            </button>
                            <Link
                              to={`/clients/edit/${client.id}`}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </Link>
                            <button type="button" className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded" title="More">
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-slate-500">
              Showing {from} to {to} of {pagination.total.toLocaleString()} clients
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 text-[13px] text-slate-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "ACTIVE";
  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-[11px] font-bold rounded ${
        isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
      }`}
    >
      {formatEnumLabel(status)}
    </span>
  );
}

function KycBadge({ status }: { status: string }) {
  if (status === "VERIFIED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
        <CheckCircle2 size={12} strokeWidth={3} /> Verified
      </span>
    );
  }
  if (status === "PENDING" || status === "UNVERIFIED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded bg-amber-50 text-amber-600 border border-amber-100">
        <Clock size={12} strokeWidth={3} /> {formatEnumLabel(status)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded bg-rose-50 text-rose-600 border border-rose-100">
      <XCircle size={12} strokeWidth={3} /> Rejected
    </span>
  );
}
