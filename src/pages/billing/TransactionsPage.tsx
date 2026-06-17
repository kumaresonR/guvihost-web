import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listTransactions } from "@/lib/api/index";
import { formatCurrency, formatDateTime, formatEnumLabel } from "@/lib/format";

type WalletTransaction = {
  id: string;
  type: string;
  amount: number | string;
  description: string;
  reference?: string | null;
  balanceAfter: number | string;
  createdAt: string;
};

export default function TransactionsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["transactions", page],
    queryFn: () => listTransactions({ page, limit: 20 }),
  });

  if (isLoading) return <PageLoader message="Loading transactions..." />;
  if (isError) return <PageError message={error instanceof Error ? error.message : "Failed to load transactions"} />;

  const transactions = (data?.items ?? []) as WalletTransaction[];
  const pagination = data?.pagination;

  return (
    <AdminLayout>
      <div className="p-6 bg-[#ffffff] min-h-full font-sans">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Transactions</h1>
          <p className="text-sm text-slate-500">Wallet credits, debits, and payment history.</p>
        </div>

        <Card className="rounded-2xl shadow-sm border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Reference</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No transactions yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isCredit = tx.type.toUpperCase() === "CREDIT";
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="p-4 text-slate-500">{formatDateTime(tx.createdAt)}</td>
                        <td className="p-4 font-medium text-slate-800">{tx.description}</td>
                        <td className="p-4 text-slate-500">{tx.reference ?? "—"}</td>
                        <td className="p-4">
                          <Badge
                            className={`border-0 text-[10px] ${
                              isCredit ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                            }`}
                          >
                            {formatEnumLabel(tx.type)}
                          </Badge>
                        </td>
                        <td className={`p-4 text-right font-bold ${isCredit ? "text-emerald-600" : "text-rose-600"}`}>
                          {isCredit ? "+" : "-"}
                          {formatCurrency(Number(tx.amount))}
                        </td>
                        <td className="p-4 text-right text-slate-600">{formatCurrency(Number(tx.balanceAfter))}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-slate-500 self-center">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
