import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { getAdminSettings, updateAdminSettings } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { useIsStaff } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";
import { GuvihostApiError } from "@/lib/guvihost-api";

type GeneralForm = {
  appName: string;
  companyName: string;
  companyGstin: string;
  companyAddress: string;
  supportEmail: string;
  supportPhone: string;
  timezone: string;
  currency: string;
  logoUrl: string;
  websiteUrl: string;
};

type BillingForm = {
  cgstPercent: string;
  sgstPercent: string;
  invoiceDueDays: string;
  enableWallet: boolean;
  enableRazorpay: boolean;
  minAddFunds: string;
  invoiceFooterNote: string;
};

type SupportForm = {
  defaultTicketPriority: string;
  allowClientAttachments: boolean;
  maxAttachmentMb: string;
  autoCloseResolvedDays: string;
  departments: string;
};

type PortalForm = {
  allowRegistration: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcementBanner: string;
};

const EMPTY_GENERAL: GeneralForm = {
  appName: "",
  companyName: "",
  companyGstin: "",
  companyAddress: "",
  supportEmail: "",
  supportPhone: "",
  timezone: "Asia/Kolkata",
  currency: "INR",
  logoUrl: "",
  websiteUrl: "",
};

export default function SettingsPage() {
  const { user } = useAuth();
  const isStaff = useIsStaff();
  const qc = useQueryClient();
  const [general, setGeneral] = useState<GeneralForm>(EMPTY_GENERAL);
  const [billing, setBilling] = useState<BillingForm>({
    cgstPercent: "9",
    sgstPercent: "9",
    invoiceDueDays: "14",
    enableWallet: true,
    enableRazorpay: true,
    minAddFunds: "100",
    invoiceFooterNote: "",
  });
  const [support, setSupport] = useState<SupportForm>({
    defaultTicketPriority: "MEDIUM",
    allowClientAttachments: true,
    maxAttachmentMb: "10",
    autoCloseResolvedDays: "7",
    departments: "Technical, Billing, Sales, General",
  });
  const [portal, setPortal] = useState<PortalForm>({
    allowRegistration: true,
    maintenanceMode: false,
    maintenanceMessage: "",
    announcementBanner: "",
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: getAdminSettings,
    enabled: isStaff,
  });

  useEffect(() => {
    if (!data) return;
    const settings = data.settings as {
      general?: Partial<GeneralForm>;
      billing?: Partial<BillingForm & { cgstPercent?: number; sgstPercent?: number; invoiceDueDays?: number; minAddFunds?: number }>;
      support?: Partial<SupportForm & { departments?: string[] }>;
      portal?: Partial<PortalForm>;
    } | undefined;

    const g = settings?.general ?? {};
    setGeneral({
      appName: g.appName ?? "",
      companyName: g.companyName ?? "",
      companyGstin: g.companyGstin ?? "",
      companyAddress: g.companyAddress ?? "",
      supportEmail: g.supportEmail ?? "",
      supportPhone: g.supportPhone ?? "",
      timezone: g.timezone ?? "Asia/Kolkata",
      currency: g.currency ?? "INR",
      logoUrl: g.logoUrl ?? "",
      websiteUrl: g.websiteUrl ?? "",
    });

    const b = settings?.billing ?? {};
    setBilling({
      cgstPercent: String(b.cgstPercent ?? 9),
      sgstPercent: String(b.sgstPercent ?? 9),
      invoiceDueDays: String(b.invoiceDueDays ?? 14),
      enableWallet: b.enableWallet ?? true,
      enableRazorpay: b.enableRazorpay ?? true,
      minAddFunds: String(b.minAddFunds ?? 100),
      invoiceFooterNote: b.invoiceFooterNote ?? "",
    });

    const s = settings?.support ?? {};
    setSupport({
      defaultTicketPriority: s.defaultTicketPriority ?? "MEDIUM",
      allowClientAttachments: s.allowClientAttachments ?? true,
      maxAttachmentMb: String(s.maxAttachmentMb ?? 10),
      autoCloseResolvedDays: String(s.autoCloseResolvedDays ?? 7),
      departments: Array.isArray(s.departments) ? s.departments.join(", ") : "Technical, Billing, Sales, General",
    });

    const p = settings?.portal ?? {};
    setPortal({
      allowRegistration: p.allowRegistration ?? true,
      maintenanceMode: p.maintenanceMode ?? false,
      maintenanceMessage: p.maintenanceMessage ?? "",
      announcementBanner: p.announcementBanner ?? "",
    });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (section: "general" | "billing" | "support" | "portal") => {
      if (section === "general") {
        return updateAdminSettings({
          general: {
            ...general,
            companyGstin: general.companyGstin || null,
            companyAddress: general.companyAddress || null,
            supportPhone: general.supportPhone || null,
            logoUrl: general.logoUrl || null,
            websiteUrl: general.websiteUrl || null,
          },
        });
      }
      if (section === "billing") {
        return updateAdminSettings({
          billing: {
            cgstPercent: parseFloat(billing.cgstPercent) || 0,
            sgstPercent: parseFloat(billing.sgstPercent) || 0,
            invoiceDueDays: parseInt(billing.invoiceDueDays, 10) || 14,
            enableWallet: billing.enableWallet,
            enableRazorpay: billing.enableRazorpay,
            minAddFunds: parseFloat(billing.minAddFunds) || 0,
            invoiceFooterNote: billing.invoiceFooterNote || null,
          },
        });
      }
      if (section === "support") {
        return updateAdminSettings({
          support: {
            defaultTicketPriority: support.defaultTicketPriority as "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY",
            allowClientAttachments: support.allowClientAttachments,
            maxAttachmentMb: parseInt(support.maxAttachmentMb, 10) || 10,
            autoCloseResolvedDays: parseInt(support.autoCloseResolvedDays, 10) || 7,
            departments: support.departments.split(",").map((d) => d.trim()).filter(Boolean),
          },
        });
      }
      return updateAdminSettings({
        portal: {
          allowRegistration: portal.allowRegistration,
          maintenanceMode: portal.maintenanceMode,
          maintenanceMessage: portal.maintenanceMessage || null,
          announcementBanner: portal.announcementBanner || null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to save settings");
    },
  });

  if (!isStaff) {
    return <PageError message="You must be signed in as staff to manage settings." />;
  }
  if (isLoading) return <PageLoader message="Loading settings..." />;
  if (isError) {
    return (
      <PageError
        message={error instanceof GuvihostApiError ? error.message : "Failed to load settings."}
      />
    );
  }

  const envOverrides = (data?.envOverrides ?? {}) as Record<string, unknown>;
  const updatedAt = data?.updatedAt ? formatDateTime(String(data.updatedAt)) : null;

  return (
    <AdminLayout>
      <div className="max-w-[900px] mx-auto space-y-6 pb-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-600" />
            Admin Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure company, billing, support, and portal defaults{user?.name ? ` — ${user.name}` : ""}.
            {updatedAt ? ` Last updated ${updatedAt}.` : ""}
          </p>
        </div>

        {(envOverrides.companyName || envOverrides.razorpayConfigured !== undefined) && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700">Environment overrides detected</p>
            <p>
              Razorpay: {envOverrides.razorpayConfigured ? "configured" : "not configured"} · SMTP:{" "}
              {envOverrides.smtpConfigured ? "configured" : "not configured"}
            </p>
          </div>
        )}

        <Tabs defaultValue="general">
          <TabsList className="bg-white border border-slate-100 rounded-xl p-1 flex-wrap h-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="portal">Portal</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <SettingsForm onSave={() => saveMutation.mutate("general")} saving={saveMutation.isPending}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="App Name" value={general.appName} onChange={(v) => setGeneral((f) => ({ ...f, appName: v }))} />
                <Field label="Company Name" value={general.companyName} onChange={(v) => setGeneral((f) => ({ ...f, companyName: v }))} />
                <Field label="Support Email" value={general.supportEmail} onChange={(v) => setGeneral((f) => ({ ...f, supportEmail: v }))} type="email" />
                <Field label="Support Phone" value={general.supportPhone} onChange={(v) => setGeneral((f) => ({ ...f, supportPhone: v }))} />
                <Field label="Company GSTIN" value={general.companyGstin} onChange={(v) => setGeneral((f) => ({ ...f, companyGstin: v }))} />
                <Field label="Currency" value={general.currency} onChange={(v) => setGeneral((f) => ({ ...f, currency: v }))} />
                <Field label="Timezone" value={general.timezone} onChange={(v) => setGeneral((f) => ({ ...f, timezone: v }))} />
                <Field label="Website URL" value={general.websiteUrl} onChange={(v) => setGeneral((f) => ({ ...f, websiteUrl: v }))} />
                <Field label="Logo URL" value={general.logoUrl} onChange={(v) => setGeneral((f) => ({ ...f, logoUrl: v }))} />
              </div>
              <div>
                <Label className="text-sm text-slate-700">Company Address</Label>
                <textarea
                  value={general.companyAddress}
                  onChange={(e) => setGeneral((f) => ({ ...f, companyAddress: e.target.value }))}
                  rows={3}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </SettingsForm>
          </TabsContent>

          <TabsContent value="billing">
            <SettingsForm onSave={() => saveMutation.mutate("billing")} saving={saveMutation.isPending}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="CGST %" value={billing.cgstPercent} onChange={(v) => setBilling((f) => ({ ...f, cgstPercent: v }))} />
                <Field label="SGST %" value={billing.sgstPercent} onChange={(v) => setBilling((f) => ({ ...f, sgstPercent: v }))} />
                <Field label="Invoice Due Days" value={billing.invoiceDueDays} onChange={(v) => setBilling((f) => ({ ...f, invoiceDueDays: v }))} />
                <Field label="Min Add Funds" value={billing.minAddFunds} onChange={(v) => setBilling((f) => ({ ...f, minAddFunds: v }))} />
              </div>
              <div>
                <Label className="text-sm text-slate-700">Invoice Footer Note</Label>
                <textarea
                  value={billing.invoiceFooterNote}
                  onChange={(e) => setBilling((f) => ({ ...f, invoiceFooterNote: e.target.value }))}
                  rows={2}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <Toggle label="Enable Wallet" checked={billing.enableWallet} onChange={(v) => setBilling((f) => ({ ...f, enableWallet: v }))} />
              <Toggle label="Enable Razorpay" checked={billing.enableRazorpay} onChange={(v) => setBilling((f) => ({ ...f, enableRazorpay: v }))} />
            </SettingsForm>
          </TabsContent>

          <TabsContent value="support">
            <SettingsForm onSave={() => saveMutation.mutate("support")} saving={saveMutation.isPending}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-700">Default Ticket Priority</Label>
                  <select
                    value={support.defaultTicketPriority}
                    onChange={(e) => setSupport((f) => ({ ...f, defaultTicketPriority: e.target.value }))}
                    className="mt-1.5 w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
                <Field label="Max Attachment (MB)" value={support.maxAttachmentMb} onChange={(v) => setSupport((f) => ({ ...f, maxAttachmentMb: v }))} />
                <Field label="Auto-close Resolved (days)" value={support.autoCloseResolvedDays} onChange={(v) => setSupport((f) => ({ ...f, autoCloseResolvedDays: v }))} />
              </div>
              <div>
                <Label className="text-sm text-slate-700">Departments (comma-separated)</Label>
                <Input
                  value={support.departments}
                  onChange={(e) => setSupport((f) => ({ ...f, departments: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <Toggle
                label="Allow Client Attachments"
                checked={support.allowClientAttachments}
                onChange={(v) => setSupport((f) => ({ ...f, allowClientAttachments: v }))}
              />
            </SettingsForm>
          </TabsContent>

          <TabsContent value="portal">
            <SettingsForm onSave={() => saveMutation.mutate("portal")} saving={saveMutation.isPending}>
              <Toggle label="Allow Registration" checked={portal.allowRegistration} onChange={(v) => setPortal((f) => ({ ...f, allowRegistration: v }))} />
              <Toggle label="Maintenance Mode" checked={portal.maintenanceMode} onChange={(v) => setPortal((f) => ({ ...f, maintenanceMode: v }))} />
              <div>
                <Label className="text-sm text-slate-700">Maintenance Message</Label>
                <textarea
                  value={portal.maintenanceMessage}
                  onChange={(e) => setPortal((f) => ({ ...f, maintenanceMessage: e.target.value }))}
                  rows={2}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <Label className="text-sm text-slate-700">Announcement Banner</Label>
                <textarea
                  value={portal.announcementBanner}
                  onChange={(e) => setPortal((f) => ({ ...f, announcementBanner: e.target.value }))}
                  rows={2}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </SettingsForm>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function SettingsForm({
  children,
  onSave,
  saving,
}: {
  children: React.ReactNode;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <form
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 mt-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      {children}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label className="text-sm text-slate-700">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 h-10 border-slate-200" />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded border-slate-300" />
      {label}
    </label>
  );
}
