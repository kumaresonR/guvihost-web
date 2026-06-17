import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { getAccountProfile, updateAccountProfile } from "@/lib/api";
import { GuvihostApiError } from "@/lib/guvihost-api";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  company: string;
  country: string;
  state: string;
  city: string;
  address: string;
  postalCode: string;
  gstin: string;
};

const emptyForm: ProfileForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  phoneCountryCode: "+91",
  company: "",
  country: "India",
  state: "",
  city: "",
  address: "",
  postalCode: "",
  gstin: "",
};

export default function MyProfilePage() {
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getAccountProfile();
        if (cancelled) return;
        setForm({
          firstName: String(profile.firstName ?? ""),
          lastName: String(profile.lastName ?? ""),
          email: String(profile.email ?? ""),
          phone: String(profile.phone ?? ""),
          phoneCountryCode: String(profile.phoneCountryCode ?? "+91"),
          company: String(profile.company ?? ""),
          country: String(profile.country ?? "India"),
          state: String(profile.state ?? ""),
          city: String(profile.city ?? ""),
          address: String(profile.address ?? ""),
          postalCode: String(profile.postalCode ?? ""),
          gstin: String(profile.gstin ?? ""),
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof GuvihostApiError ? e.message : "Failed to load profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAccountProfile(form);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader message="Loading profile..." />;
  if (error) return <PageError message={error} />;

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto font-sans">
        <h1 className="text-xl font-bold text-[#0a1b3f] mb-2">My Account</h1>
        <p className="text-slate-500 mb-8">Manage your account details and preferences.</p>

        <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-[#0a1b3f] mb-6">Account Information</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required />
            <Field label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required />
            <Field label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} required className="sm:col-span-2" />
            <div className="sm:col-span-2">
              <Label className="text-sm font-semibold text-slate-700">Phone Number</Label>
              <div className="flex mt-1.5">
                <div className="px-3 py-2 border border-slate-200 bg-slate-50 rounded-l-lg text-sm">{form.phoneCountryCode}</div>
                <Input name="phone" value={form.phone} onChange={handleChange} className="rounded-l-none" />
              </div>
            </div>
            <Field label="Company Name" name="company" value={form.company} onChange={handleChange} className="sm:col-span-2" />
            <Field label="Country" name="country" value={form.country} onChange={handleChange} required />
            <Field label="State" name="state" value={form.state} onChange={handleChange} required />
            <Field label="City" name="city" value={form.city} onChange={handleChange} required />
            <Field label="Postal Code" name="postalCode" value={form.postalCode} onChange={handleChange} />
            <Field label="GSTIN" name="gstin" value={form.gstin} onChange={handleChange} className="sm:col-span-2" />
            <div className="sm:col-span-2">
              <Label className="text-sm font-semibold text-slate-700">Address</Label>
              <textarea name="address" value={form.address} onChange={handleChange} required rows={3} className="w-full mt-1.5 p-3 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  className = "",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      <Input type={type} name={name} value={value} onChange={onChange} required={required} className="h-11 rounded-lg border-slate-200" />
    </div>
  );
}
