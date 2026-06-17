import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { getAccountProfile, updateEmailPreferences } from "@/lib/api";
import { GuvihostApiError } from "@/lib/guvihost-api";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type EmailPrefs = {
  generalAnnouncements: boolean;
  invoiceNotifications: boolean;
  supportNotifications: boolean;
  promotionsOffers: boolean;
};

const defaultPrefs: EmailPrefs = {
  generalAnnouncements: true,
  invoiceNotifications: true,
  supportNotifications: true,
  promotionsOffers: false,
};

export default function EmailPrefsPage() {
  const [prefs, setPrefs] = useState<EmailPrefs>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getAccountProfile();
        if (cancelled) return;
        const ep = profile.emailPreferences as Partial<EmailPrefs> | null | undefined;
        if (ep) {
          setPrefs({
            generalAnnouncements: ep.generalAnnouncements ?? true,
            invoiceNotifications: ep.invoiceNotifications ?? true,
            supportNotifications: ep.supportNotifications ?? true,
            promotionsOffers: ep.promotionsOffers ?? false,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof GuvihostApiError ? e.message : "Failed to load email preferences");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateEmailPreferences(prefs);
      toast.success("Email preferences saved");
    } catch (err) {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof EmailPrefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  if (loading) return <PageLoader message="Loading preferences..." />;
  if (error) return <PageError message={error} />;

  const items: { key: keyof EmailPrefs; label: string; desc: string }[] = [
    { key: "generalAnnouncements", label: "General Announcements", desc: "Receive general news and announcements." },
    { key: "invoiceNotifications", label: "Invoice Notifications", desc: "Receive invoice and billing notifications." },
    { key: "supportNotifications", label: "Support Ticket Updates", desc: "Receive updates on your support tickets." },
    { key: "promotionsOffers", label: "Promotions & Offers", desc: "Receive promotions and special offers." },
  ];

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl mx-auto font-sans">
        <h1 className="text-xl font-bold text-[#0a1b3f] mb-2">Email Preferences</h1>
        <p className="text-slate-500 mb-8">Choose which emails you want to receive.</p>

        <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
          <div className="space-y-6">
            {items.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
                <Switch checked={prefs[item.key]} onCheckedChange={() => toggle(item.key)} />
              </div>
            ))}
          </div>
          <Button onClick={handleSave} disabled={saving} className="mt-6 bg-blue-600 hover:bg-blue-700">
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </Card>
      </div>
    </AdminLayout>
  );
}
