import { AdminLayout } from "@/components/admin/AdminLayout";

export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <AdminLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-sm">{message}</p>
      </div>
    </AdminLayout>
  );
}

export function PageError({ message }: { message: string }) {
  return (
    <AdminLayout>
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p>
      </div>
    </AdminLayout>
  );
}
