import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { createStaff, getStaffDepartments } from "@/lib/api";
import { useIsStaff } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { GuvihostApiError } from "@/lib/guvihost-api";

export default function CreateStaffPage() {
  const navigate = useNavigate();
  const isStaff = useIsStaff();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "SUPPORT_AGENT",
    phone: "",
    department: "Support",
    jobTitle: "",
    notes: "",
    sendWelcomeEmail: true,
  });

  const departmentsQuery = useQuery({
    queryKey: ["staff-departments"],
    queryFn: getStaffDepartments,
    enabled: isStaff,
  });

  const createMutation = useMutation({
    mutationFn: () => createStaff(form),
    onSuccess: () => {
      toast.success("Staff member created");
      navigate("/staff");
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to create staff");
    },
  });

  const setField = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (!isStaff) {
    return <PageError message="You must be signed in as staff to create staff accounts." />;
  }
  if (departmentsQuery.isLoading) return <PageLoader message="Loading..." />;

  const departments = departmentsQuery.data ?? ["Support", "Billing", "Sales"];

  return (
    <AdminLayout>
      <div className="bg-white min-h-full p-4 sm:p-6 font-sans max-w-[800px] mx-auto space-y-6">
        <div className="flex items-start gap-4">
          <Link to="/staff" className="mt-1 p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-[22px] font-bold text-slate-900">Create Staff Member</h1>
            <p className="text-sm text-slate-500 mt-1">Add a new admin or support team member.</p>
          </div>
        </div>

        <form
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" value={form.firstName} onChange={(v) => setField("firstName", v)} required />
            <Field label="Last Name" value={form.lastName} onChange={(v) => setField("lastName", v)} required />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setField("email", v)} required />
            <Field label="Username" value={form.username} onChange={(v) => setField("username", v)} required />
            <Field label="Phone" value={form.phone} onChange={(v) => setField("phone", v)} />
            <div>
              <Label className="text-sm text-slate-700">Role</Label>
              <select
                value={form.role}
                onChange={(e) => setField("role", e.target.value)}
                className="mt-1.5 w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white"
              >
                <option value="SUPPORT_AGENT">Support Agent</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div>
              <Label className="text-sm text-slate-700">Department</Label>
              <select
                value={form.department}
                onChange={(e) => setField("department", e.target.value)}
                className="mt-1.5 w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Job Title" value={form.jobTitle} onChange={(v) => setField("jobTitle", v)} />
            <div className="sm:col-span-2">
              <Label className="text-sm text-slate-700">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  required
                  minLength={8}
                  onChange={(e) => setField("password", e.target.value)}
                  className="h-10 border-slate-200 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Field
              label="Confirm Password"
              type="password"
              value={form.confirmPassword}
              onChange={(v) => setField("confirmPassword", v)}
              required
            />
          </div>

          <div>
            <Label className="text-sm text-slate-700">Notes</Label>
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.sendWelcomeEmail}
              onChange={(e) => setField("sendWelcomeEmail", e.target.checked)}
              className="rounded border-slate-300"
            />
            Send welcome email
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate("/staff")}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {createMutation.isPending ? "Creating..." : "Create Staff"}
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
