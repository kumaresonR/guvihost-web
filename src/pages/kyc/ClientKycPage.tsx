import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ClientRoute } from "@/components/ClientRoute";
import { PageLoader, PageError } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getKycStatus, submitKyc, submitKycPersonal, uploadKycDocument } from "@/lib/api";
import { formatEnumLabel } from "@/lib/format";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, FileUp, Shield, Upload } from "lucide-react";

const DOC_TYPES = [
  { key: "IDENTITY_PROOF", label: "Identity Proof" },
  { key: "ADDRESS_PROOF", label: "Address Proof" },
  { key: "SELFIE", label: "Selfie" },
  { key: "SIGNATURE", label: "Signature" },
];

const STEPS = ["Personal Details", "Documents", "Review & Submit"];

export default function ClientKycPage() {
  const queryClient = useQueryClient();
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState<string | null>(null);
  const [personal, setPersonal] = useState({
    dateOfBirth: "",
    panNumber: "",
    aadhaarNumber: "",
    nationality: "Indian",
    idProofType: "PAN Card",
    addressProofType: "Aadhaar",
    address: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
  });

  const { data: kyc, isLoading, isError, error } = useQuery({
    queryKey: ["kyc-status"],
    queryFn: getKycStatus,
  });

  const personalMutation = useMutation({
    mutationFn: () => submitKycPersonal(personal),
    onSuccess: () => {
      toast.success("Personal details saved");
      queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
      setStep(1);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submitMutation = useMutation({
    mutationFn: submitKyc,
    onSuccess: () => {
      toast.success("KYC submitted for review");
      queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleUpload = async (docType: string, file: File) => {
    setUploading(docType);
    try {
      await uploadKycDocument(docType, file);
      toast.success(`${formatEnumLabel(docType)} uploaded`);
      queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  if (isLoading) return <PageLoader message="Loading KYC..." />;
  if (isError) {
    return <PageError message={error instanceof Error ? error.message : "Failed to load KYC status"} />;
  }

  const status = String(kyc!.status ?? "UNVERIFIED");
  const progress = Number(kyc!.progress ?? 0);
  const documents = (kyc!.documents as { docType: string; status: string; label?: string; fileName?: string }[]) ?? [];
  const canSubmit = Boolean(kyc!.canSubmit);
  const isVerified = status === "VERIFIED";
  const isPendingReview = status === "PENDING" && kyc!.submittedAt;

  const docMap = Object.fromEntries(documents.map((d) => [d.docType, d]));

  return (
    <ClientRoute>
      <AdminLayout>
        <div className="p-6 bg-[#f8f9fa] min-h-full font-sans max-w-3xl mx-auto">
          <Link to="/client-dashboard" className="inline-flex items-center gap-2 text-sm text-blue-600 mb-4">
            <ArrowLeft size={16} /> Back to dashboard
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-blue-600" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">KYC Verification</h1>
              <p className="text-sm text-slate-500">Complete verification to unlock all features</p>
            </div>
          </div>

          <Card className="p-6 mb-6 rounded-2xl border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <Badge className={isVerified ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}>
                {formatEnumLabel(status)}
              </Badge>
              <span className="text-sm text-slate-500">{progress}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </Card>

          {isVerified ? (
            <Card className="p-8 text-center rounded-2xl border-emerald-100 bg-emerald-50/30">
              <CheckCircle className="mx-auto text-emerald-600 mb-3" size={48} />
              <h2 className="text-xl font-bold text-emerald-800">Verification Complete</h2>
              <p className="text-sm text-emerald-700 mt-2">Your account is fully verified.</p>
            </Card>
          ) : isPendingReview ? (
            <Card className="p-8 text-center rounded-2xl border-blue-100 bg-blue-50/30">
              <Shield className="mx-auto text-blue-600 mb-3" size={48} />
              <h2 className="text-xl font-bold">Under Review</h2>
              <p className="text-sm text-slate-600 mt-2">Your KYC has been submitted and is being reviewed.</p>
            </Card>
          ) : (
            <>
              <div className="flex gap-2 mb-6">
                {STEPS.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStep(i)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border ${
                      step === i ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    {i + 1}. {s}
                  </button>
                ))}
              </div>

              {step === 0 && (
                <Card className="p-6 rounded-2xl border-slate-100 shadow-sm space-y-4">
                  <h2 className="font-bold">Personal Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date of Birth</Label>
                      <Input type="date" value={personal.dateOfBirth} onChange={(e) => setPersonal({ ...personal, dateOfBirth: e.target.value })} />
                    </div>
                    <div>
                      <Label>PAN Number</Label>
                      <Input value={personal.panNumber} onChange={(e) => setPersonal({ ...personal, panNumber: e.target.value.toUpperCase() })} maxLength={10} />
                    </div>
                    <div>
                      <Label>Aadhaar (optional)</Label>
                      <Input value={personal.aadhaarNumber} onChange={(e) => setPersonal({ ...personal, aadhaarNumber: e.target.value })} />
                    </div>
                    <div>
                      <Label>Nationality</Label>
                      <Input value={personal.nationality} onChange={(e) => setPersonal({ ...personal, nationality: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input value={personal.address} onChange={(e) => setPersonal({ ...personal, address: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input value={personal.city} onChange={(e) => setPersonal({ ...personal, city: e.target.value })} />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input value={personal.state} onChange={(e) => setPersonal({ ...personal, state: e.target.value })} />
                    </div>
                    <div>
                      <Label>Postal Code</Label>
                      <Input value={personal.postalCode} onChange={(e) => setPersonal({ ...personal, postalCode: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>ID Proof Type</Label>
                      <Select value={personal.idProofType} onValueChange={(v) => setPersonal({ ...personal, idProofType: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PAN Card">PAN Card</SelectItem>
                          <SelectItem value="Passport">Passport</SelectItem>
                          <SelectItem value="Driving License">Driving License</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Address Proof Type</Label>
                      <Select value={personal.addressProofType} onValueChange={(v) => setPersonal({ ...personal, addressProofType: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Aadhaar">Aadhaar</SelectItem>
                          <SelectItem value="Utility Bill">Utility Bill</SelectItem>
                          <SelectItem value="Bank Statement">Bank Statement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full bg-blue-600" disabled={personalMutation.isPending} onClick={() => personalMutation.mutate()}>
                    Save & Continue
                  </Button>
                </Card>
              )}

              {step === 1 && (
                <Card className="p-6 rounded-2xl border-slate-100 shadow-sm space-y-4">
                  <h2 className="font-bold">Upload Documents</h2>
                  {DOC_TYPES.map(({ key, label }) => {
                    const doc = docMap[key];
                    const uploaded = doc?.status === "UPLOADED" || doc?.status === "VERIFIED";
                    return (
                      <div key={key} className="flex items-center justify-between border rounded-lg p-4">
                        <div>
                          <p className="font-medium">{label}</p>
                          <p className="text-xs text-slate-500">
                            {uploaded ? doc?.fileName ?? "Uploaded" : "Not uploaded"}
                          </p>
                        </div>
                        <div>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            ref={(el) => { fileRefs.current[key] = el; }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUpload(key, file);
                              e.target.value = "";
                            }}
                          />
                          <Button
                            size="sm"
                            variant={uploaded ? "outline" : "default"}
                            className="gap-2"
                            disabled={uploading === key}
                            onClick={() => fileRefs.current[key]?.click()}
                          >
                            {uploading === key ? <FileUp size={14} /> : <Upload size={14} />}
                            {uploaded ? "Replace" : "Upload"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <Button variant="outline" className="w-full" onClick={() => setStep(2)}>Continue to Review</Button>
                </Card>
              )}

              {step === 2 && (
                <Card className="p-6 rounded-2xl border-slate-100 shadow-sm space-y-4">
                  <h2 className="font-bold">Review & Submit</h2>
                  <ul className="space-y-2 text-sm">
                    {DOC_TYPES.map(({ key, label }) => {
                      const doc = docMap[key];
                      const done = doc?.status === "UPLOADED" || doc?.status === "VERIFIED";
                      return (
                        <li key={key} className="flex items-center gap-2">
                          <CheckCircle size={16} className={done ? "text-emerald-600" : "text-slate-300"} />
                          {label}: {done ? "Ready" : "Missing"}
                        </li>
                      );
                    })}
                  </ul>
                  <Button
                    className="w-full bg-blue-600"
                    disabled={!canSubmit || submitMutation.isPending}
                    onClick={() => submitMutation.mutate()}
                  >
                    Submit for Verification
                  </Button>
                  {!canSubmit && (
                    <p className="text-xs text-amber-600 text-center">Upload all documents before submitting.</p>
                  )}
                </Card>
              )}
            </>
          )}
        </div>
      </AdminLayout>
    </ClientRoute>
  );
}
