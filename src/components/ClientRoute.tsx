import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useIsClient } from "@/hooks/use-role";
import { PageLoader } from "@/components/PageLoader";

export function ClientRoute({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const isClient = useIsClient();

  if (isLoading) return <PageLoader message="Loading..." />;
  if (!isClient) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
