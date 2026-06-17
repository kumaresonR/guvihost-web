import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, Loader2, XCircle, Box, ShieldCheck, Headset, Tag } from "lucide-react";
import { verifyEmail } from "@/lib/api/auth";
import { GuvihostApiError } from "@/lib/guvihost-api";
import { toast } from "sonner";
import leftAuthImage from "@/assets/auth/login-left.png";

type VerifyState = "loading" | "success" | "error" | "missing";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<VerifyState>(token ? "loading" : "missing");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const result = await verifyEmail(token);
        if (cancelled) return;
        setState("success");
        setMessage(result.message || "Email verified successfully");
        toast.success("Email verified");
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof GuvihostApiError ? err.message : "Email verification failed";
        setState("error");
        setMessage(msg);
        toast.error(msg);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#ffffff] font-sans">
      <div className="hidden lg:flex w-[40%] bg-[#eff4fa] flex-col py-12 px-16 border-r border-blue-100/50">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-[#0b5cff] text-white rounded-lg font-bold text-3xl italic flex items-center justify-center w-14 h-14 shadow-lg shadow-blue-500/30">
            G
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#0a1b3f] tracking-tight">GUVIHOST</h1>
            <p className="text-[10px] font-bold text-gray-500 tracking-[0.2em] uppercase mt-0.5">
              — Cloud • Hosting • Solutions —
            </p>
          </div>
        </div>
        <div className="relative w-full max-w-[320px] mx-auto mb-10">
          <img src={leftAuthImage} alt="Cloud Hosting Illustration" className="w-full h-auto object-contain drop-shadow-xl" />
        </div>
        <div className="space-y-6">
          <FeatureItem icon={<Box size={20} />} title="Verify Email" desc="Confirm your email to unlock all account features." />
          <FeatureItem icon={<ShieldCheck size={20} />} title="Secure Account" desc="Email verification helps protect your hosting account." />
          <FeatureItem icon={<Headset size={20} />} title="Support Ready" desc="Verified accounts receive full support access." />
          <FeatureItem icon={<Tag size={20} />} title="Full Access" desc="Enable two-factor authentication after verification." />
        </div>
      </div>

      <div className="w-full lg:w-[60%] flex items-center justify-center p-6 sm:p-12 mt-24">
        <div className="w-full max-w-[620px] bg-white rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-gray-100 p-10 sm:p-14 text-center">
          {state === "loading" && (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-[#0b5cff] mx-auto" />
              <h2 className="text-[28px] font-bold text-[#0a1b3f]">Verifying Email</h2>
              <p className="text-gray-500 text-[15px]">Please wait while we confirm your email address...</p>
            </div>
          )}

          {state === "success" && (
            <div className="space-y-6">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
              <div>
                <h2 className="text-[28px] font-bold text-[#0a1b3f] mb-2">Email Verified</h2>
                <p className="text-gray-500 text-[15px]">{message}</p>
              </div>
              <Link to="/login" className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#0b5cff] hover:text-blue-700">
                Continue to Login
              </Link>
            </div>
          )}

          {(state === "error" || state === "missing") && (
            <div className="space-y-6">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <div>
                <h2 className="text-[28px] font-bold text-[#0a1b3f] mb-2">Verification Failed</h2>
                <p className="text-gray-500 text-[15px]">
                  {state === "missing"
                    ? "Invalid verification link. Check your email for the correct link."
                    : message}
                </p>
              </div>
              <Link to="/login" className="inline-flex items-center gap-2 text-[14px] font-medium text-gray-600 hover:text-gray-900">
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-[#0b5cff] text-white p-2.5 rounded-lg shadow-md shadow-blue-500/20 shrink-0">{icon}</div>
      <div className="pt-0.5">
        <h4 className="font-bold text-[#0a1b3f] text-[15px] mb-1">{title}</h4>
        <p className="text-[13px] text-[#64748b] leading-relaxed pr-4">{desc}</p>
      </div>
    </div>
  );
}
