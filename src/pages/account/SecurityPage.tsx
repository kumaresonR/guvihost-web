import React, { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { changePassword, getAccountSecurity, getSecuritySessions, revokeSession } from "@/lib/api";
import {
  disable2fa,
  logoutAllDevices,
  request2faEnable,
  resendVerificationEmail,
  verify2faEnable,
} from "@/lib/api/auth";
import { formatDateTime } from "@/lib/format";
import { GuvihostApiError } from "@/lib/guvihost-api";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Monitor, KeyRound, Mail, LogOut } from "lucide-react";

type SecurityInfo = {
  email: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorMethod?: string;
};

type SessionRow = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
};

export default function SecurityPage() {
  const [security, setSecurity] = useState<SecurityInfo | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);

  const [twoFactorChallengeId, setTwoFactorChallengeId] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const loadData = useCallback(async () => {
    const [sec, sess] = await Promise.all([getAccountSecurity(), getSecuritySessions()]);
    setSecurity(sec as SecurityInfo);
    setSessions(sess as SessionRow[]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadData();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof GuvihostApiError ? e.message : "Failed to load security settings");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChanging(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to change password");
    } finally {
      setChanging(false);
    }
  };

  const handleResendVerification = async () => {
    setResendingEmail(true);
    try {
      const result = await resendVerificationEmail();
      toast.success(result.message || "Verification email sent");
    } catch (err) {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to resend verification email");
    } finally {
      setResendingEmail(false);
    }
  };

  const handleRequest2fa = async () => {
    setTwoFactorLoading(true);
    try {
      const result = await request2faEnable();
      setTwoFactorChallengeId(result.challengeId);
      toast.message("Check your email for the security code");
    } catch (err) {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to start 2FA setup");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorChallengeId) return;
    setTwoFactorLoading(true);
    try {
      await verify2faEnable(twoFactorChallengeId, twoFactorCode.trim());
      toast.success("Two-factor authentication enabled");
      setTwoFactorChallengeId(null);
      setTwoFactorCode("");
      await loadData();
    } catch (err) {
      toast.error(err instanceof GuvihostApiError ? err.message : "Invalid security code");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisableLoading(true);
    try {
      await disable2fa(disablePassword);
      toast.success("Two-factor authentication disabled");
      setDisablePassword("");
      await loadData();
    } catch (err) {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to disable 2FA");
    } finally {
      setDisableLoading(false);
    }
  };

  const handleRevokeSession = async (id: string) => {
    setRevokingId(id);
    try {
      await revokeSession(id);
      toast.success("Session revoked");
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to revoke session");
    } finally {
      setRevokingId(null);
    }
  };

  const handleLogoutAllDevices = async () => {
    setLoggingOutAll(true);
    try {
      await logoutAllDevices();
      toast.success("Logged out from all other devices");
      await loadData();
    } catch (err) {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to logout all devices");
    } finally {
      setLoggingOutAll(false);
    }
  };

  if (loading) return <PageLoader message="Loading security..." />;
  if (error) return <PageError message={error} />;

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto font-sans space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#0a1b3f]">Security</h1>
          <p className="text-slate-500 mt-1">Manage password, two-factor authentication, and active sessions.</p>
        </div>

        <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield size={20} className="text-blue-600" /> Account Security
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Email</span>
              <span className="font-medium">{security?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Email verified</span>
              <div className="flex items-center gap-2">
                <Badge className={security?.emailVerified ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}>
                  {security?.emailVerified ? "Verified" : "Not verified"}
                </Badge>
                {!security?.emailVerified && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={resendingEmail}
                    onClick={handleResendVerification}
                    className="gap-1"
                  >
                    <Mail size={14} />
                    {resendingEmail ? "Sending..." : "Resend"}
                  </Button>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Two-factor authentication</span>
              <Badge className={security?.twoFactorEnabled ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"}>
                {security?.twoFactorEnabled ? `Enabled (${security.twoFactorMethod ?? "EMAIL"})` : "Disabled"}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <KeyRound size={20} className="text-blue-600" /> Two-Factor Authentication
          </h2>

          {security?.twoFactorEnabled ? (
            <form onSubmit={handleDisable2fa} className="space-y-4 max-w-md">
              <p className="text-sm text-slate-500">Enter your password to disable two-factor authentication.</p>
              <div className="space-y-1.5">
                <Label>Account Password</Label>
                <Input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" variant="destructive" disabled={disableLoading}>
                {disableLoading ? "Disabling..." : "Disable 2FA"}
              </Button>
            </form>
          ) : twoFactorChallengeId ? (
            <form onSubmit={handleVerify2fa} className="space-y-4 max-w-md">
              <p className="text-sm text-slate-500">Enter the code sent to your email to enable 2FA.</p>
              <div className="space-y-1.5">
                <Label>Security Code</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="6-digit code"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={twoFactorLoading} className="bg-blue-600 hover:bg-blue-700">
                  {twoFactorLoading ? "Verifying..." : "Verify & Enable"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTwoFactorChallengeId(null);
                    setTwoFactorCode("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Add an extra layer of security by requiring a code sent to your email when signing in.
              </p>
              <Button
                type="button"
                onClick={handleRequest2fa}
                disabled={twoFactorLoading || !security?.emailVerified}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {twoFactorLoading ? "Sending code..." : "Enable 2FA"}
              </Button>
              {!security?.emailVerified && (
                <p className="text-xs text-amber-600">Verify your email before enabling two-factor authentication.</p>
              )}
            </div>
          )}
        </Card>

        <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Monitor size={20} className="text-blue-600" /> Active Sessions
            </h2>
            {sessions.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loggingOutAll}
                onClick={handleLogoutAllDevices}
                className="gap-1"
              >
                <LogOut size={14} />
                {loggingOutAll ? "Logging out..." : "Logout All Devices"}
              </Button>
            )}
          </div>
          {sessions.length === 0 ? (
            <p className="text-sm text-slate-500">No active sessions found.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="p-4 border border-slate-100 rounded-xl text-sm flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.userAgent ?? "Unknown device"}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      IP: {s.ipAddress ?? "—"} · Started {formatDateTime(s.createdAt)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={revokingId === s.id}
                    onClick={() => handleRevokeSession(s.id)}
                  >
                    {revokingId === s.id ? "Revoking..." : "Revoke"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold mb-6">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={changing} className="bg-blue-600 hover:bg-blue-700">
              {changing ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
}
