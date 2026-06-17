import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ClientRoute } from "@/components/ClientRoute";
import { PageLoader } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTicket, getTicketDepartments, getTicketServices } from "@/lib/api";
import { formatEnumLabel } from "@/lib/format";
import { toast } from "sonner";
import { ArrowLeft, Headset } from "lucide-react";

type Department = {
  id: string;
  name: string;
  categories: { id: string; name: string }[];
};

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const [departmentId, setDepartmentId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const departmentsQuery = useQuery({
    queryKey: ["ticket-departments"],
    queryFn: getTicketDepartments,
  });

  const servicesQuery = useQuery({
    queryKey: ["ticket-services"],
    queryFn: getTicketServices,
  });

  const departments = (departmentsQuery.data ?? []) as Department[];
  const services = (servicesQuery.data ?? []) as { id: string; name: string; domain?: string; type: string }[];

  const categories = useMemo(() => {
    return departments.find((d) => d.id === departmentId)?.categories ?? [];
  }, [departments, departmentId]);

  const createMutation = useMutation({
    mutationFn: () =>
      createTicket({
        departmentId,
        categoryId,
        serviceId: serviceId || undefined,
        priority,
        subject: subject.trim(),
        description: description.trim(),
      }),
    onSuccess: (ticket) => {
      toast.success("Ticket created");
      navigate(`/support/tickets/${String(ticket.id)}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentId || !categoryId || subject.trim().length < 5 || description.trim().length < 10) {
      toast.error("Fill all required fields (subject min 5, description min 10 chars)");
      return;
    }
    createMutation.mutate();
  };

  if (departmentsQuery.isLoading) return <PageLoader message="Loading form..." />;

  return (
    <ClientRoute>
      <AdminLayout>
        <div className="p-6 bg-[#f8f9fa] min-h-full font-sans max-w-2xl">
          <Link to="/client-dashboard" className="inline-flex items-center gap-2 text-sm text-blue-600 mb-4">
            <ArrowLeft size={16} /> Back to dashboard
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <Headset className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900">Open Support Ticket</h1>
          </div>

          <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label>Department</Label>
                <Select
                  value={departmentId}
                  onValueChange={(v) => {
                    setDepartmentId(v);
                    setCategoryId("");
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId} disabled={!departmentId}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Related Service (optional)</Label>
                <Select value={serviceId || "none"} onValueChange={(v) => setServiceId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} {s.domain ? `(${s.domain})` : `· ${formatEnumLabel(s.type)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["LOW", "MEDIUM", "HIGH", "EMERGENCY"].map((p) => (
                      <SelectItem key={p} value={p}>{formatEnumLabel(p)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary of your issue" />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  rows={5}
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Submit Ticket"}
              </Button>
            </form>
          </Card>
        </div>
      </AdminLayout>
    </ClientRoute>
  );
}
