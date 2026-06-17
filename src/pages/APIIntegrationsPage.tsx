import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { getIntegrationsStatus, getEmailStatus, sendTestEmail } from "@/lib/api";
import { useIsStaff } from "@/hooks/use-role";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Mail, Globe, Plug, CheckCircle, XCircle } from "lucide-react";
import { GuvihostApiError } from "@/lib/guvihost-api";
import { toast } from "sonner";

type IntegrationCardProps = {
  title: string;
  description: string;
  configured: boolean;
  icon: typeof Plug;
  details: { label: string; value: string | null }[];
  children?: React.ReactNode;
};

function IntegrationCard({ title, description, configured, icon: Icon, details, children }: IntegrationCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${configured ? "bg-emerald-500" : "bg-slate-300"}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>
        <Badge className={`border-0 gap-1 ${configured ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {configured ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {configured ? "Connected" : "Not configured"}
        </Badge>
      </div>
      <dl className="space-y-2 mb-4">
        {details.map((item) => (
          <div key={item.label} className="flex justify-between gap-4 text-sm">
            <dt className="text-slate-500">{item.label}</dt>
            <dd className="font-medium text-slate-800 text-right">{item.value ?? "—"}</dd>
          </div>
        ))}
      </dl>
      {children}
    </div>
  );
}

export default function APIIntegrationsPage() {
  const isStaff = useIsStaff();
  const [testEmail, setTestEmail] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["integrations-status"],
    queryFn: getIntegrationsStatus,
    enabled: isStaff,
  });

  const emailStatusQuery = useQuery({
    queryKey: ["email-status"],
    queryFn: getEmailStatus,
    enabled: isStaff,
  });

  const testMutation = useMutation({
    mutationFn: () => sendTestEmail(testEmail.trim()),
    onSuccess: () => toast.success("Test email sent"),
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isStaff) {
    return <PageError message="You must be signed in as staff to view integrations." />;
  }
  if (isLoading) return <PageLoader message="Loading integrations..." />;
  if (isError) {
    return (
      <PageError
        message={error instanceof GuvihostApiError ? error.message : "Failed to load integrations."}
      />
    );
  }

  const razorpay = (data?.razorpay ?? {}) as { configured?: boolean; keyId?: string | null };
  const smtp = (data?.smtp ?? {}) as { configured?: boolean; host?: string | null; from?: string | null };
  const google = (data?.googleOAuth ?? {}) as { configured?: boolean; clientId?: string | null };
  const smtpReady = Boolean(smtp.configured || (emailStatusQuery.data as { configured?: boolean })?.configured);

  return (
    <AdminLayout>
      <div className="max-w-[1000px] mx-auto space-y-6 pb-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Plug className="h-6 w-6 text-blue-600" />
            API Integrations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Payment, email, and authentication provider status. Credentials are managed via server environment variables.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <IntegrationCard
            title="Razorpay"
            description="Payment gateway for invoices and checkout"
            configured={Boolean(razorpay.configured)}
            icon={CreditCard}
            details={[{ label: "Key ID", value: razorpay.keyId ?? null }]}
          />
          <IntegrationCard
            title="SMTP Email"
            description="Outbound email for invoices, tickets, and notifications"
            configured={smtpReady}
            icon={Mail}
            details={[
              { label: "Host", value: smtp.host ?? null },
              { label: "From", value: smtp.from ?? null },
            ]}
          >
            {smtpReady && (
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
                <div className="flex-1">
                  <Label htmlFor="test-email" className="text-xs">Send test email to</Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="you@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  className="sm:self-end bg-blue-600"
                  disabled={!testEmail.trim() || testMutation.isPending}
                  onClick={() => testMutation.mutate()}
                >
                  {testMutation.isPending ? "Sending..." : "Send Test"}
                </Button>
              </div>
            )}
          </IntegrationCard>
          <IntegrationCard
            title="Google OAuth"
            description="Social login for client portal (set VITE_GOOGLE_CLIENT_ID on frontend)"
            configured={Boolean(google.configured)}
            icon={Globe}
            details={[{ label: "Client ID", value: google.clientId ?? null }]}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
