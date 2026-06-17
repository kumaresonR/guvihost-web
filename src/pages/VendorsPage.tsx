import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable, SummaryWidget } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { VendorModal } from "@/components/admin/modals/VendorModal"; // Keeping component name to match your imports
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, ShieldCheck, Clock, Ban, Eye, Pencil, Trash2, UserX } from "lucide-react";
import { exportToCSV } from "@/lib/csv";
import { toast } from "sonner";

// --- DUMMY DATA FOR RUSHPLATE RESTAURANTS ---
let DUMMY_RESTAURANTS: any[] = [
  { id: "REST-1001", business_name: "Spice Symphony", name: "Rahul Sharma", email: "contact@spicesymphony.com", mobile: "+91 9876543210", status: "active", commission_rate: 15, created_at: "2023-10-01T10:00:00Z" },
  { id: "REST-1002", business_name: "Burger Joint", name: "Amit Kumar", email: "hello@burgerjoint.com", mobile: "+91 9876543211", status: "active", commission_rate: 12, created_at: "2023-10-05T14:30:00Z" },
  { id: "REST-1003", business_name: "Beijing Bites", name: "Neha Verma", email: "info@beijingbites.com", mobile: "+91 9876543212", status: "active", commission_rate: 15, created_at: "2023-11-12T09:15:00Z" },
  { id: "REST-1004", business_name: "South Express", name: "Meera Reddy", email: "orders@southexpress.com", mobile: "+91 9876543213", status: "active", commission_rate: 10, created_at: "2023-12-20T11:45:00Z" },
  
  // Pending Applications
  { id: "APP-2001", business_name: "Mughlai Darbar", name: "Suresh Pillai", email: "suresh@mughlaidarbar.com", mobile: "+91 9876543214", status: "pending", commission_rate: 0, created_at: "2024-04-10T16:20:00Z", _isApplication: true },
  { id: "APP-2002", business_name: "The Dessert Heaven", name: "Pooja Desai", email: "sweet@dessertheaven.com", mobile: "+91 9876543215", status: "pending", commission_rate: 0, created_at: "2024-04-14T08:10:00Z", _isApplication: true },
  
  // Rejected Applications
  { id: "APP-2003", business_name: "Sushi Master", name: "Kenji Sato", email: "kenji@sushimaster.com", mobile: "+91 9876543216", status: "rejected", commission_rate: 0, created_at: "2024-03-01T13:50:00Z", rejection_reason: "Incomplete menu documentation", _isApplication: true },
  { id: "APP-2004", business_name: "Taco Fiesta", name: "Carlos Ray", email: "carlos@tacofiesta.com", mobile: "+91 9876543217", status: "rejected", commission_rate: 0, created_at: "2024-03-15T09:30:00Z", rejection_reason: "FSSAI License Expired", _isApplication: true },
  
  // Deactivated
  { id: "REST-1005", business_name: "Biryani Blues", name: "Anita Sharma", email: "anita@biryaniblues.com", mobile: "+91 9876543218", status: "deactivated", commission_rate: 15, created_at: "2023-09-05T15:25:00Z" },
];

export default function VendorsPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [data, setData] = useState<{ data: any[], total: number, page: number, per_page: number, total_pages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<string>();
  const [dateTo, setDateTo] = useState<string>();
  const [selected, setSelected] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("view");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ restaurant: any; action: "approve" | "reject" | "delete" } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [totalStats, setTotalStats] = useState({ total: 0, active: 0, pending: 0, rejected: 0, deactivated: 0, deleted: 0 });

  // Simulated Stats Fetch
  const fetchStats = useCallback(() => {
    setTotalStats({
      total: DUMMY_RESTAURANTS.filter(r => r.status !== 'deleted').length,
      active: DUMMY_RESTAURANTS.filter(r => r.status === 'active').length,
      pending: DUMMY_RESTAURANTS.filter(r => r.status === 'pending').length,
      rejected: DUMMY_RESTAURANTS.filter(r => r.status === 'rejected').length,
      deactivated: DUMMY_RESTAURANTS.filter(r => r.status === 'deactivated').length,
      deleted: DUMMY_RESTAURANTS.filter(r => r.status === 'deleted').length,
    });
  }, []);

  // Simulated Data Fetch
  const fetchData = useCallback(() => {
    setTimeout(() => {
      let filtered = [...DUMMY_RESTAURANTS];

      // Tab Filtering
      if (activeTab === "pending") {
        filtered = filtered.filter(r => r.status === "pending");
      } else if (activeTab === "rejected") {
        filtered = filtered.filter(r => r.status === "rejected");
      } else if (activeTab === "deactivated") {
        filtered = filtered.filter(r => r.status === "deactivated");
      } else if (activeTab === "deleted") {
        filtered = filtered.filter(r => r.status === "deleted");
      } else {
        // "all" active restaurants
        filtered = filtered.filter(r => r.status === "active");
        if (statusFilter) filtered = filtered.filter(r => r.status === statusFilter);
      }

      // Search Filtering
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(r => 
          r.business_name.toLowerCase().includes(q) || 
          r.name.toLowerCase().includes(q) || 
          r.email.toLowerCase().includes(q) ||
          r.mobile.includes(q)
        );
      }

      // Date Filtering
      if (dateFrom) filtered = filtered.filter(r => new Date(r.created_at) >= new Date(dateFrom));
      if (dateTo) filtered = filtered.filter(r => new Date(r.created_at) <= new Date(dateTo + 'T23:59:59Z'));

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
  }, [page, search, statusFilter, dateFrom, dateTo, activeTab]);

  useEffect(() => { fetchData(); fetchStats(); }, [fetchData, fetchStats]);
  useEffect(() => { setPage(1); setStatusFilter(""); }, [activeTab]);

  const openModal = (restaurant: any | null, mode: "view" | "edit" | "create") => {
    setSelected(restaurant); setModalMode(mode); setModalOpen(true);
  };

  const handleSave = async (id: string, updates: any) => {
    const index = DUMMY_RESTAURANTS.findIndex(r => r.id === id);
    if (index > -1) {
      DUMMY_RESTAURANTS[index] = { ...DUMMY_RESTAURANTS[index], ...updates };
      toast.success("Restaurant updated");
    }
    fetchData(); fetchStats(); setModalOpen(false);
  };

  const handleCreate = async (data: any) => {
    const newRestaurant = {
      ...data,
      id: `REST-${Math.floor(Math.random() * 9000) + 1000}`,
      status: data.status || "active",
      commission_rate: data.commission_rate || 15,
      created_at: new Date().toISOString()
    };
    DUMMY_RESTAURANTS = [newRestaurant, ...DUMMY_RESTAURANTS];
    toast.success("Restaurant added successfully"); 
    fetchData(); fetchStats(); setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const index = DUMMY_RESTAURANTS.findIndex(r => r.id === id);
    if (index > -1) {
      DUMMY_RESTAURANTS[index].status = "deleted";
      DUMMY_RESTAURANTS[index].deleted_at = new Date().toISOString();
    }
    toast.success("Restaurant deleted"); 
    fetchData(); fetchStats();
  };

  const handleBulkDelete = async (ids: string[]) => {
    DUMMY_RESTAURANTS = DUMMY_RESTAURANTS.map(r => 
      ids.includes(r.id) ? { ...r, status: "deleted", deleted_at: new Date().toISOString() } : r
    );
    toast.success(`${ids.length} restaurants deleted`);
    fetchData(); fetchStats();
  };

  const handleBulkStatus = async (ids: string[], status: string) => {
    DUMMY_RESTAURANTS = DUMMY_RESTAURANTS.map(r => ids.includes(r.id) ? { ...r, status } : r);
    toast.success(`${ids.length} restaurants updated to ${status}`);
    fetchData(); fetchStats();
  };

  const openConfirm = (restaurant: any, action: "approve" | "reject" | "delete") => {
    setConfirmAction({ restaurant, action }); setConfirmOpen(true);
  };

  const handleConfirm = async (reason?: string) => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    
    setTimeout(() => {
      const { restaurant, action } = confirmAction;
      const index = DUMMY_RESTAURANTS.findIndex(r => r.id === restaurant.id);
      
      if (index > -1) {
        if (action === "delete") {
          DUMMY_RESTAURANTS[index].status = "deleted";
          toast.success("Application/Restaurant deleted");
        } else if (action === "reject") {
          DUMMY_RESTAURANTS[index].status = "rejected";
          DUMMY_RESTAURANTS[index].rejection_reason = reason;
          toast.success("Restaurant application rejected");
        } else if (action === "approve") {
          DUMMY_RESTAURANTS[index].status = "active";
          DUMMY_RESTAURANTS[index]._isApplication = false;
          DUMMY_RESTAURANTS[index].id = `REST-${Date.now().toString().slice(-4)}`; // Generate new ID upon approval
          toast.success("Restaurant approved and activated");
        }
      }
      
      setConfirmLoading(false); setConfirmOpen(false); setConfirmAction(null);
      fetchData(); fetchStats();
    }, 400);
  };

  const handleExport = () => {
    if (!data) return;
    exportToCSV(data.data, [
      { key: "id", label: "ID" }, { key: "business_name", label: "Restaurant Name" },
      { key: "name", label: "Owner" }, { key: "email", label: "Email" },
      { key: "commission_rate", label: "Commission %" }, { key: "status", label: "Status" },
    ], "rushplate_restaurants");
    toast.success("CSV exported");
  };

  if (!data) return <AdminLayout><div className="flex items-center justify-center h-64"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div></AdminLayout>;

  const isSpecialTab = activeTab === "deactivated" || activeTab === "deleted";

  const summaryWidgets: SummaryWidget[] = activeTab === "pending" ? [
    { label: "Pending Approvals", value: totalStats.pending, icon: <Clock className="h-5 w-5 text-warning" />, color: "bg-warning/5", textColor: "text-warning" },
  ] : activeTab === "deactivated" ? [
    { label: "Deactivated Restaurants", value: totalStats.deactivated, icon: <UserX className="h-5 w-5 text-warning" />, color: "bg-warning/5", textColor: "text-warning" },
  ] : activeTab === "deleted" ? [
    { label: "Deleted Restaurants", value: totalStats.deleted, icon: <Trash2 className="h-5 w-5 text-destructive" />, color: "bg-destructive/5", textColor: "text-destructive" },
  ] : [
    { label: "Total Restaurants", value: totalStats.total, icon: <Store className="h-5 w-5 text-primary" />, color: "bg-primary/5" },
    { label: "Active", value: totalStats.active, icon: <ShieldCheck className="h-5 w-5 text-success" />, color: "bg-success/5", textColor: "text-success" },
    { label: "Pending", value: totalStats.pending, icon: <Clock className="h-5 w-5 text-warning" />, color: "bg-warning/5", textColor: "text-warning" },
    { label: "Rejected", value: totalStats.rejected, icon: <Ban className="h-5 w-5 text-destructive" />, color: "bg-destructive/5", textColor: "text-destructive" },
  ];

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title">Restaurants</h1>
        <div className="flex items-center gap-2">
          <p className="page-description">{data.total.toLocaleString()} restaurants · Delivery Partner Network</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="all">Active Restaurants</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="deactivated">Deactivated ({totalStats.deactivated})</TabsTrigger>
          <TabsTrigger value="deleted">Deleted</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={isSpecialTab ? [
          { key: "id", label: "ID" },
          { key: "business_name", label: "Restaurant", render: (r: any) => (
            <div><p className="font-medium">{r.business_name}</p><p className="text-xs text-muted-foreground">{r.name}</p></div>
          )},
          { key: "email", label: "Email", render: (r: any) => <span className="text-xs">{r.email}</span> },
          { key: "mobile", label: "Mobile", render: (r: any) => <span className="text-xs">{r.mobile}</span> },
          { key: "deleted_at", label: activeTab === "deleted" ? "Deleted At" : "Deactivated", render: (r: any) => <span className="text-xs text-muted-foreground">{r.deleted_at ? new Date(r.deleted_at).toLocaleDateString() : '—'}</span> },
          { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
          { key: "actions", label: "", render: (r: any) => (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e: any) => { e.stopPropagation(); openModal(r, "view"); }}><Eye className="h-4 w-4" /></Button>
          )},
        ] : [
          { key: "id", label: "ID" },
          { key: "business_name", label: "Restaurant", render: (r: any) => (
            <div><p className="font-medium">{r.business_name}</p><p className="text-xs text-muted-foreground">{r.name}</p></div>
          )},
          { key: "email", label: "Email" },
          { key: "mobile", label: "Mobile" },
          { key: "commission_rate", label: "Commission", render: (r: any) => <span>{r.commission_rate}%</span> },
          { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
          { key: "actions", label: "Actions", render: (r: any) => (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e: any) => { e.stopPropagation(); openModal(r, "view"); }}><Eye className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e: any) => { e.stopPropagation(); openModal(r, "edit"); }}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e: any) => { e.stopPropagation(); openConfirm(r, "delete"); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          )},
        ]}
        data={data.data}
        total={data.total}
        page={data.page}
        perPage={data.per_page}
        totalPages={data.total_pages}
        onPageChange={setPage}
        onSearch={setSearch}
        onExport={handleExport}
        onAdd={!isSpecialTab ? () => { openModal(null, "create"); } : undefined}
        addLabel="Add Restaurant"
        onRowClick={(r) => openModal(r, "view")}
        onFilterChange={(key, val) => { if (key === "status") { setStatusFilter(val); setPage(1); } }}
        onDateRangeChange={(f, t) => { setDateFrom(f); setDateTo(t); setPage(1); }}
        searchPlaceholder="Search restaurants, owners, or emails..."
        summaryWidgets={summaryWidgets}
        enableBulkSelect={!isSpecialTab}
        onBulkDelete={!isSpecialTab ? handleBulkDelete : undefined}
        onBulkStatusUpdate={!isSpecialTab ? handleBulkStatus : undefined}
        bulkStatusOptions={!isSpecialTab ? [
          { value: "pending", label: "Pending" },
          { value: "active", label: "Active" },
          { value: "deactivated", label: "Deactivate" },
        ] : undefined}
      />
      <VendorModal vendor={selected as any} open={modalOpen} onOpenChange={setModalOpen} mode={modalMode} onSave={handleSave} onCreate={handleCreate} onDelete={handleDelete} vendorType="product" onRefresh={fetchData} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmAction?.action === "approve" ? "Approve Restaurant" : confirmAction?.action === "delete" ? "Delete Restaurant" : "Reject Application"}
        description={confirmAction?.action === "approve" ? `Approve "${confirmAction.restaurant.business_name}" to start receiving orders?` : confirmAction?.action === "delete" ? `Delete "${confirmAction?.restaurant.business_name}" from the network?` : `Reject "${confirmAction?.restaurant.business_name}"? Please provide a reason.`}
        confirmLabel={confirmAction?.action === "approve" ? "Approve" : confirmAction?.action === "delete" ? "Delete" : "Reject"}
        variant={confirmAction?.action === "approve" ? "default" : "destructive"}
        onConfirm={handleConfirm}
        loading={confirmLoading}
        showReasonField={confirmAction?.action === "reject"}
        reasonLabel="Rejection Reason *"
        reasonPlaceholder="Explain why this restaurant application is being rejected..."
      />
    </AdminLayout>
  );
}