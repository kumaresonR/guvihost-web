import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { getClient, updateClient } from "@/lib/api";
import { formatEnumLabel } from "@/lib/format";
import { useIsStaff } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { GuvihostApiError } from "@/lib/guvihost-api";

type ClientForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  company: string;
  gstin: string;
  dateOfBirth: string;
  address: string;
  country: string;
  state: string;
  city: string;
  postalCode: string;
  language: string;
  currency: string;
  creditLimit: string;
  taxExempt: boolean;
  internalNotes: string;
  status: string;
  kycStatus: string;
};

const EMPTY: ClientForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  phoneCountryCode: "+91",
  company: "",
  gstin: "",
  dateOfBirth: "",
  address: "",
  country: "India",
  state: "",
  city: "",
  postalCode: "",
  language: "en",
  currency: "INR",
  creditLimit: "0",
  taxExempt: false,
  internalNotes: "",
  status: "ACTIVE",
  kycStatus: "UNVERIFIED",
};

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isStaff = useIsStaff();
  const [form, setForm] = useState<ClientForm>(EMPTY);

  const clientQuery = useQuery({
    queryKey: ["client", id],
    queryFn: () => getClient(id!),
    enabled: isStaff && Boolean(id),
  });

  useEffect(() => {
    const c = clientQuery.data;
    if (!c) return;
    setForm({
      firstName: String(c.firstName ?? ""),
      lastName: String(c.lastName ?? ""),
      email: String(c.email ?? ""),
      phone: String(c.phone ?? ""),
      phoneCountryCode: String(c.phoneCountryCode ?? "+91"),
      company: String(c.company ?? ""),
      gstin: String(c.gstin ?? ""),
      dateOfBirth: c.dateOfBirth ? String(c.dateOfBirth).slice(0, 10) : "",
      address: String(c.address ?? ""),
      country: String(c.country ?? "India"),
      state: String(c.state ?? ""),
      city: String(c.city ?? ""),
      postalCode: String(c.postalCode ?? ""),
      language: String(c.language ?? "en"),
      currency: String(c.currency ?? "INR"),
      creditLimit: String(c.creditLimit ?? 0),
      taxExempt: Boolean(c.taxExempt),
      internalNotes: String(c.internalNotes ?? ""),
      status: String(c.status ?? "ACTIVE"),
      kycStatus: String(c.kycStatus ?? "UNVERIFIED"),
    });
  }, [clientQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateClient(id!, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        phoneCountryCode: form.phoneCountryCode,
        company: form.company || undefined,
        gstin: form.gstin || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        address: form.address || undefined,
        country: form.country,
        state: form.state || undefined,
        city: form.city || undefined,
        postalCode: form.postalCode || undefined,
        language: form.language,
        currency: form.currency,
        creditLimit: parseFloat(form.creditLimit) || 0,
        taxExempt: form.taxExempt,
        internalNotes: form.internalNotes || undefined,
        status: form.status,
        kycStatus: form.kycStatus,
      }),
    onSuccess: () => {
      toast.success("Client updated");
      navigate("/clients/all");
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to update client");
    },
  });

  const setField = (key: keyof ClientForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (!isStaff) {
    return <PageError message="You must be signed in as staff to edit clients." />;
  }
  if (clientQuery.isLoading) return <PageLoader message="Loading client..." />;
  if (clientQuery.isError || !id) {
    return (
      <PageError
        message={
          clientQuery.error instanceof GuvihostApiError
            ? clientQuery.error.message
            : "Failed to load client."
        }
      />
    );
  }

  const clientCode = String(clientQuery.data?.clientCode ?? "");

  return (
    <AdminLayout>
      <div className="bg-white min-h-full p-4 sm:p-6 font-sans max-w-[1100px] mx-auto space-y-6">
        <div className="flex items-start gap-4">
          <Link
            to="/clients/all"
            className="mt-1 p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-[22px] font-bold text-slate-900">Edit Client</h1>
            <p className="text-sm text-slate-500 mt-1">
              {clientCode ? `Client code: ${clientCode}` : "Update client profile and account settings."}
            </p>
          </div>
        </div>

        <form
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" value={form.firstName} onChange={(v) => setField("firstName", v)} required />
            <Field label="Last Name" value={form.lastName} onChange={(v) => setField("lastName", v)} required />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setField("email", v)} required />
            <Field label="Phone" value={form.phone} onChange={(v) => setField("phone", v)} />
            <Field label="Company" value={form.company} onChange={(v) => setField("company", v)} />
            <Field label="GSTIN" value={form.gstin} onChange={(v) => setField("gstin", v)} />
            <Field label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v) => setField("dateOfBirth", v)} />
            <Field label="Credit Limit" value={form.creditLimit} onChange={(v) => setField("creditLimit", v)} />
            <Field label="Country" value={form.country} onChange={(v) => setField("country", v)} />
            <Field label="State" value={form.state} onChange={(v) => setField("state", v)} />
            <Field label="City" value={form.city} onChange={(v) => setField("city", v)} />
            <Field label="Postal Code" value={form.postalCode} onChange={(v) => setField("postalCode", v)} />
            <SelectField
              label="Status"
              value={form.status}
              onChange={(v) => setField("status", v)}
              options={["ACTIVE", "INACTIVE", "SUSPENDED"]}
            />
            <SelectField
              label="KYC Status"
              value={form.kycStatus}
              onChange={(v) => setField("kycStatus", v)}
              options={["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"]}
            />
            <SelectField
              label="Language"
              value={form.language}
              onChange={(v) => setField("language", v)}
              options={["en", "hi", "ta"]}
            />
            <SelectField
              label="Currency"
              value={form.currency}
              onChange={(v) => setField("currency", v)}
              options={["INR", "USD"]}
            />
          </div>

          <div>
            <Label className="text-sm text-slate-700">Address</Label>
            <textarea
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <Label className="text-sm text-slate-700">Internal Notes</Label>
            <textarea
              value={form.internalNotes}
              onChange={(e) => setField("internalNotes", e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.taxExempt}
              onChange={(e) => setField("taxExempt", e.target.checked)}
              className="rounded border-slate-300"
            />
            Tax exempt
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate("/clients/all")}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label className="text-sm text-slate-700">{label}</Label>
      <Input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-10 border-slate-200"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <Label className="text-sm text-slate-700">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {formatEnumLabel(opt)}
          </option>
        ))}
      </select>
    </div>
  );
}
