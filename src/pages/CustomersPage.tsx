import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable, SummaryWidget } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { User, PaginatedResponse } from "@/lib/api";
import { CustomerModal } from "@/components/admin/modals/CustomerModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Pencil, Trash2, Users, UserCheck, UserX, Star, UserMinus } from "lucide-react";
import { exportToCSV } from "@/lib/csv";
import { toast } from "sonner";

// --- DUMMY DATA FOR RUSHPLATE CUSTOMERS ---
let DUMMY_CUSTOMERS: any[] = [
  { id: "CUST-1001", name: "Rahul Sharma", email: "rahul.s@example.com", mobile: "+91 9876543210", occupation: "Software Engineer", wallet_points: 450, referral_code: "RAHUL450", status: "active", created_at: "2023-05-12T10:00:00Z" },
  { id: "CUST-1002", name: "Priya Patel", email: "priya.p@example.com", mobile: "+91 9876543211", occupation: "Doctor", wallet_points: 1200, referral_code: "PRIYA12", status: "active", created_at: "2023-06-15T14:30:00Z" },
  { id: "CUST-1003", name: "Amit Kumar", email: "amit.k@example.com", mobile: "+91 9876543212", occupation: "Student", wallet_points: 50, referral_code: "AMIT50", status: "inactive", created_at: "2023-08-20T09:15:00Z" },
  { id: "CUST-1004", name: "Sneha Reddy", email: "sneha.r@example.com", mobile: "+91 9876543213", occupation: "Business Owner", wallet_points: 850, referral_code: "SNEHA85", status: "active", created_at: "2023-09-10T11:45:00Z" },
  { id: "CUST-1005", name: "Vikram Singh", email: "vikram.s@example.com", mobile: "+91 9876543214", occupation: "Software Engineer", wallet_points: 0, referral_code: "VIKRAM00", status: "suspended", created_at: "2023-10-05T16:20:00Z" },
  { id: "CUST-1006", name: "Anita Desai", email: "anita.d@example.com", mobile: "+91 9876543215", occupation: "Teacher", wallet_points: 320, referral_code: "ANITA32", status: "active", created_at: "2023-11-22T08:10:00Z" },
  { id: "CUST-1007", name: "Rohan Gupta", email: "rohan.g@example.com", mobile: "+91 9876543216", occupation: "Student", wallet_points: 150, referral_code: "ROHAN15", status: "deactivated", created_at: "2023-12-01T13:50:00Z", deleted_at: "2024-01-15T10:00:00Z" },
  { id: "CUST-1008", name: "Meera Nair", email: "meera.n_DEL_1705300000@example.com", mobile: "+91 9876543217_DEL_1705300000", occupation: "Doctor", wallet_points: 0, referral_code: "MEERA00", status: "deleted", created_at: "2024-01-10T09:30:00Z", deleted_at: "2024-02-20T11:00:00Z" },
  { id: "CUST-1009", name: "Kabir Das", email: "kabir.d@example.com", mobile: "+91 9876543218", occupation: "Business Owner", wallet_points: 600, referral_code: "KABIR60", status: "active", created_at: "2024-02-05T15:25:00Z" },
  { id: "CUST-1010", name: "Pooja Verma", email: "pooja.v@example.com", mobile: "+91 9876543219", occupation: "Software Engineer", wallet_points: 210, referral_code: "POOJA21", status: "active", created_at: "2024-03-12T10:40:00Z" },
  { id: "CUST-1011", name: "Arjun Pillai", email: "arjun.p@example.com", mobile: "+91 9876543220", occupation: "Student", wallet_points: 80, referral_code: "ARJUN80", status: "inactive", created_at: "2024-03-20T14:15:00Z" },
  { id: "CUST-1012", name: "Neha Sharma", email: "neha.s@example.com", mobile: "+91 9876543221", occupation: "Teacher", wallet_points: 400, referral_code: "NEHA40", status: "active", created_at: "2024-04-02T09:05:00Z" },
];

const DUMMY_OCCUPATIONS = [
  { id: "1", name: "Software Engineer" },
  { id: "2", name: "Doctor" },
  { id: "3", name: "Student" },
  { id: "4", name: "Business Owner" },
  { id: "5", name: "Teacher" },
];

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState("active");
  const [data, setData] = useState<PaginatedResponse<User> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [occupationFilter, setOccupationFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<string>();
  const [dateTo, setDateTo] = useState<string>();
  const [selected, setSelected] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("view");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<User | null>(null);
  const [totalStats, setTotalStats] = useState({ total: 0, active: 0, inactive: 0, deactivated: 0, deleted: 0, points: 0 });

  const occupations = DUMMY_OCCUPATIONS;

  // Simulated Stats Fetch
  const fetchStats = useCallback(() => {
    const total = DUMMY_CUSTOMERS.filter(c => c.status !== 'deleted').length;
    const active = DUMMY_CUSTOMERS.filter(c => c.status === 'active').length;
    const deactivated = DUMMY_CUSTOMERS.filter(c => c.status === 'deactivated').length;
    const deleted = DUMMY_CUSTOMERS.filter(c => c.status === 'deleted').length;
    const points = DUMMY_CUSTOMERS.filter(c => c.status !== 'deleted').reduce((sum, c) => sum + (c.wallet_points || 0), 0);
    
    setTotalStats({
      total,
      active,
      inactive: DUMMY_CUSTOMERS.filter(c => c.status === 'inactive' || c.status === 'suspended').length,
      deactivated,
      deleted,
      points,
    });
  }, []);

  // Simulated Data Fetch
  const fetchData = useCallback(() => {
    setTimeout(() => {
      let filtered = [...DUMMY_CUSTOMERS];

      // Tab Filtering
      if (activeTab === "deactivated") {
        filtered = filtered.filter(c => c.status === "deactivated");
      } else if (activeTab === "deleted") {
        filtered = filtered.filter(c => c.status === "deleted");
      } else {
        // "All Customers" tab means active, inactive, suspended
        filtered = filtered.filter(c => c.status !== "deactivated" && c.status !== "deleted");
      }

      // Search Filtering
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(c => 
          c.name.toLowerCase().includes(q) || 
          c.email.toLowerCase().includes(q) || 
          c.mobile.toLowerCase().includes(q)
        );
      }

      // Status & Occupation Filters
      if (statusFilter) filtered = filtered.filter(c => c.status === statusFilter);
      if (occupationFilter) filtered = filtered.filter(c => c.occupation === occupationFilter);

      // Date Filtering
      if (dateFrom) filtered = filtered.filter(c => new Date(c.created_at) >= new Date(dateFrom));
      if (dateTo) filtered = filtered.filter(c => new Date(c.created_at) <= new Date(dateTo + 'T23:59:59Z'));

      // Pagination
      const perPage = 10;
      const total = filtered.length;
      const totalPages = Math.ceil(total / perPage);
      const paginatedData = filtered.slice((page - 1) * perPage, page * perPage);

      setData({
        data: paginatedData,
        total,
        page,
        per_page: perPage,
        total_pages: totalPages
      });
    }, 300);
  }, [page, search, statusFilter, occupationFilter, dateFrom, dateTo, activeTab]);

  useEffect(() => { fetchData(); fetchStats(); }, [fetchData, fetchStats]);
  useEffect(() => { setPage(1); setStatusFilter(""); setOccupationFilter(""); }, [activeTab]);

  const openModal = (user: any, mode: "view" | "edit" | "create") => {
    setSelected(user); setModalMode(mode); setModalOpen(true);
  };

  // Simulated API Actions
  const handleSave = async (id: string, updates: Partial<User>) => {
    const index = DUMMY_CUSTOMERS.findIndex(c => c.id === id);
    if (index > -1) DUMMY_CUSTOMERS[index] = { ...DUMMY_CUSTOMERS[index], ...updates };
    toast.success("Customer updated"); 
    fetchData(); fetchStats(); setModalOpen(false);
  };

  const handleCreate = async (data: Partial<User>) => {
    const newCustomer = {
      ...data,
      id: `CUST-${Math.floor(Math.random() * 9000) + 1000}`,
      status: data.status || "active",
      wallet_points: data.wallet_points || 0,
      created_at: new Date().toISOString()
    };
    DUMMY_CUSTOMERS = [newCustomer, ...DUMMY_CUSTOMERS];
    toast.success("Customer created"); 
    fetchData(); fetchStats(); setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const index = DUMMY_CUSTOMERS.findIndex(c => c.id === id);
    if (index > -1) {
      DUMMY_CUSTOMERS[index].status = "deleted";
      DUMMY_CUSTOMERS[index].deleted_at = new Date().toISOString();
      DUMMY_CUSTOMERS[index].email = `${DUMMY_CUSTOMERS[index].email}_DEL_${Date.now()}`;
    }
    toast.success("Customer deleted (soft)"); 
    fetchData(); fetchStats();
  };

  const handleBulkDelete = async (ids: string[]) => {
    DUMMY_CUSTOMERS = DUMMY_CUSTOMERS.map(c => 
      ids.includes(c.id) ? { ...c, status: "deleted", deleted_at: new Date().toISOString() } : c
    );
    toast.success(`${ids.length} customers deleted (soft)`);
    fetchData(); fetchStats();
  };

  const handleBulkStatus = async (ids: string[], status: string) => {
    DUMMY_CUSTOMERS = DUMMY_CUSTOMERS.map(c => ids.includes(c.id) ? { ...c, status } : c);
    toast.success(`${ids.length} customers updated to ${status}`);
    fetchData(); fetchStats();
  };

  const handleExport = () => {
    if (!data) return;
    exportToCSV(data.data, [
      { key: "id", label: "ID" }, { key: "name", label: "Name" },
      { key: "email", label: "Email" }, { key: "mobile", label: "Mobile" },
      { key: "occupation", label: "Occupation" },
      { key: "wallet_points", label: "Points" }, { key: "referral_code", label: "Referral Code" },
      { key: "status", label: "Status" }, { key: "created_at", label: "Registered" },
    ], "rushplate_customers");
    toast.success("CSV exported");
  };

  if (!data) return <AdminLayout><div className="flex items-center justify-center h-64"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div></AdminLayout>;

  const summaryWidgets: SummaryWidget[] = activeTab === "active" ? [
    { label: "Total Customers", value: totalStats.total, icon: <Users className="h-5 w-5 text-primary" />, color: "bg-primary/5" },
    { label: "Active", value: totalStats.active, icon: <UserCheck className="h-5 w-5 text-success" />, color: "bg-success/5", textColor: "text-success" },
    { label: "Inactive / Suspended", value: totalStats.inactive, icon: <UserX className="h-5 w-5 text-destructive" />, color: "bg-destructive/5", textColor: "text-destructive" },
    { label: "Total Wallet Points", value: totalStats.points.toLocaleString(), icon: <Star className="h-5 w-5 text-warning" />, color: "bg-warning/5", textColor: "text-warning" },
  ] : activeTab === "deactivated" ? [
    { label: "Deactivated Accounts", value: totalStats.deactivated, icon: <UserMinus className="h-5 w-5 text-warning" />, color: "bg-warning/5", textColor: "text-warning" },
  ] : [
    { label: "Deleted Accounts", value: totalStats.deleted, icon: <Trash2 className="h-5 w-5 text-destructive" />, color: "bg-destructive/5", textColor: "text-destructive" },
  ];

  const isSpecialTab = activeTab === "deactivated" || activeTab === "deleted";

  const columns = isSpecialTab ? [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email", render: (u: any) => <span className="text-xs">{u.email?.replace(/_DEL_\d+$/, '') || '—'}</span> },
    { key: "mobile", label: "Mobile", render: (u: any) => <span className="text-xs">{u.mobile?.replace(/_DEL_\d+$/, '') || '—'}</span> },
    { key: "deleted_at", label: activeTab === "deleted" ? "Deleted At" : "Deactivated", render: (u: any) => <span className="text-xs text-muted-foreground">{u.deleted_at ? new Date(u.deleted_at).toLocaleDateString() : u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span> },
    { key: "status", label: "Status", render: (u: any) => <StatusBadge status={u.status} /> },
    { key: "actions", label: "", render: (u: any) => (
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openModal(u, "view"); }}><Eye className="h-4 w-4" /></Button>
    )},
  ] : [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "mobile", label: "Mobile" },
    { key: "occupation", label: "Occupation", render: (u: any) => <span className="text-sm">{u.occupation || '—'}</span> },
    { key: "wallet_points", label: "Points", render: (u: any) => <span className="font-semibold">{u.wallet_points.toLocaleString()}</span> },
    { key: "status", label: "Status", render: (u: any) => <StatusBadge status={u.status} /> },
    { key: "actions", label: "", render: (u: any) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openModal(u, "view"); }}><Eye className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openModal(u, "edit"); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); setConfirmTarget(u); setConfirmOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <p className="page-description">{data.total.toLocaleString()} {activeTab === "active" ? "registered" : activeTab} customers</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="active">All Customers</TabsTrigger>
          <TabsTrigger value="deactivated">Deactivated ({totalStats.deactivated})</TabsTrigger>
          <TabsTrigger value="deleted">Deleted ({totalStats.deleted})</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={data.data}
        total={data.total}
        page={data.page}
        perPage={data.per_page}
        totalPages={data.total_pages}
        onPageChange={setPage}
        onSearch={setSearch}
        onExport={handleExport}
        onAdd={!isSpecialTab ? () => openModal(null, "create") : undefined}
        addLabel="Add Customer"
        onRowClick={(u) => openModal(u, "view")}
        onFilterChange={(key, val) => {
          if (key === "status") { setStatusFilter(val); setPage(1); }
          if (key === "occupation") { setOccupationFilter(val); setPage(1); }
        }}
        onDateRangeChange={(f, t) => { setDateFrom(f); setDateTo(t); setPage(1); }}
        searchPlaceholder="Search by name, email, mobile..."
        filters={!isSpecialTab ? [
          { key: "status", label: "Status", options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "suspended", label: "Suspended" }] },
          { key: "occupation", label: "Occupation", options: occupations.map(o => ({ value: o.name, label: o.name })) },
        ] : undefined}
        summaryWidgets={summaryWidgets}
        enableBulkSelect={!isSpecialTab}
        onBulkDelete={!isSpecialTab ? handleBulkDelete : undefined}
        onBulkStatusUpdate={!isSpecialTab ? handleBulkStatus : undefined}
        bulkStatusOptions={!isSpecialTab ? [
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
          { value: "suspended", label: "Suspended" },
        ] : undefined}
      />
      
      {/* We pass 'any' to avoid rigid type errors if User interface doesn't perfectly match our dummy data */}
      <CustomerModal customer={selected as any} open={modalOpen} onOpenChange={setModalOpen} mode={modalMode} onSave={handleSave} onCreate={handleCreate} onDelete={handleDelete} />
      
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Delete Customer" description={`Are you sure you want to delete "${confirmTarget?.name}"? The account data will be retained for 90 days for audit purposes.`} confirmLabel="Delete" variant="destructive"
        onConfirm={async () => { if (confirmTarget) { await handleDelete(confirmTarget.id); setConfirmOpen(false); } }} />
    </AdminLayout>
  );
}