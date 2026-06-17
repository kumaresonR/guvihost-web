import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle, Box, ShieldCheck, Headset, Tag } from "lucide-react";
import { forgotPassword } from "@/lib/api/auth";
import { GuvihostApiError } from "@/lib/guvihost-api";
import { toast } from "sonner";
import leftAuthImage from "@/assets/auth/login-left.png";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
      toast.success("Password reset email sent");
    } catch (err) {
      const message =
        err instanceof GuvihostApiError ? err.message : "Failed to send reset email";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

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

        <div className="text-center mb-8">
          <h2 className="text-[28px] font-bold text-[#1a2b4f] mb-3">Reset Your Password</h2>
          <p className="text-[#64748b] text-[15px] leading-relaxed max-w-xs mx-auto">
            We&apos;ll send you a secure link to reset your account password.
          </p>
        </div>

        <div className="relative w-full max-w-[320px] mx-auto mb-10">
          <img src={leftAuthImage} alt="Cloud Hosting Illustration" className="w-full h-auto object-contain drop-shadow-xl" />
        </div>

        <div className="space-y-6">
          <FeatureItem icon={<Box size={20} />} title="Secure Recovery" desc="Password reset links expire after a short time for your safety." />
          <FeatureItem icon={<ShieldCheck size={20} />} title="Account Protection" desc="Only you can access the reset link sent to your email." />
          <FeatureItem icon={<Headset size={20} />} title="Need Help?" desc="Contact support if you don't receive the email within a few minutes." />
          <FeatureItem icon={<Tag size={20} />} title="Quick Access" desc="Reset your password and get back to managing your services." />
        </div>
      </div>

      <div className="w-full lg:w-[60%] flex items-center justify-center p-6 sm:p-12 mt-24">
        <div className="w-full max-w-[620px] bg-white rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-gray-100 p-10 sm:p-14">
          {sent ? (
            <div className="text-center space-y-6">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
              <div>
                <h2 className="text-[28px] font-bold text-[#0a1b3f] mb-2">Check Your Email</h2>
                <p className="text-gray-500 text-[15px]">
                  If an account exists for <strong>{email}</strong>, we sent password reset instructions.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#0b5cff] hover:text-blue-700"
              >
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <h2 className="text-[28px] font-bold text-[#0a1b3f] mb-2">Forgot Password?</h2>
                <p className="text-gray-500 text-[15px]">
                  Enter your registered email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-gray-800">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Mail size={20} strokeWidth={1.5} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="Enter your email address"
                      className={`block w-full pl-12 pr-4 py-3.5 border ${error ? "border-red-500" : "border-gray-200"} rounded-xl text-[15px] text-gray-700 outline-none transition-all`}
                    />
                  </div>
                  {error && <p className="text-red-500 text-xs font-medium mt-1">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl text-[15px] font-semibold text-white bg-[#0b5cff] hover:bg-blue-700 disabled:opacity-70"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>

                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 py-3 text-[14px] font-medium text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft size={16} />
                  Back to Login
                </Link>
              </form>
            </>
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
