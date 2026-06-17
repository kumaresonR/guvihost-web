import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useIsStaff, useIsClient } from "@/hooks/use-role";

// --- CORE & AUTH PAGES ---
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import DashboardClientPage from "./pages/DashboardClientPage";

// --- CLIENTS SUB-MENU PAGES ---
import AllClientsPage from "./pages/clients/AllClientsPage";
import AddClientPage from "./pages/clients/AddClientPage";
import KYCPage from "./pages/clients/KYCPage";
import KYCVerification from "./pages/clients/KYCVerification";
import ClientNotesPage from "./pages/clients/ClientNotesPage";
import LoginAsClientPage from "./pages/clients/LoginAsClientPage";
import EditClientPage from "./pages/clients/EditClientPage";

// --- STAFF & QUOTES & KB & AFFILIATES ---
import CreateStaffPage from "./pages/staff/CreateStaffPage";
import StaffDetailPage from "./pages/staff/StaffDetailPage";
import AdminQuotesPage from "./pages/quotes/AdminQuotesPage";
import AdminQuoteDetailPage from "./pages/quotes/AdminQuoteDetailPage";
import ClientQuotesPage from "./pages/quotes/ClientQuotesPage";
import AdminKbPage from "./pages/kb/AdminKbPage";
import AffiliatesPage from "./pages/affiliates/AffiliatesPage";

// --- CORE SERVICES & MANAGEMENT PAGES ---
import DomainsPage from "./pages/DomainsPage";
import HostingPage from "./pages/HostingPage"; 
import BillingPage from "./pages/BillingPage";
import OrdersPage from "./pages/OrdersPage";
import SupportTicketsPage from "./pages/SupportTicketsPage";
import ServersPage from "./pages/ServersPage";
import AutomationPage from "./pages/AutomationPage";
import ReportsPage from "./pages/ReportsPage";
import StaffManagementPage from "./pages/StaffManagementPage";
import SettingsPage from "./pages/SettingsPage";
import APIIntegrationsPage from "./pages/APIIntegrationsPage"; 
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";


// --- SERVICES SUB-MENU ---
import SharedHostingPage from "./pages/services/SharedHostingPage";
import VPSHostingPage from "./pages/services/VPSHostingPage";
import DedicatedServersPage from "./pages/services/DedicatedServersPage";
import OrderServicePage from "./pages/services/OrderServicePage";
import EmailServicesPage from "./pages/services/EmailServicesPage";
import AllServicesPage from "./pages/services/AllServices";

// --- BILLING SUB-MENU ---
import InvoicesPage from "./pages/billing/InvoicesPage";
import TransactionsPage from "./pages/billing/TransactionsPage";
import PaymentMethodsPage from "./pages/billing/PaymentMethodsPage";
import InvoiceDetailPage from "./pages/billing/InvoiceDetailPage";
import AddFundsPage from "./pages/billing/AddFundsPage";

// --- CLIENT COMMERCE ---
import CartPage from "./pages/cart/CartPage";
import CheckoutPage from "./pages/cart/CheckoutPage";
import MyOrdersPage from "./pages/orders/MyOrdersPage";

// --- SUPPORT SUB-MENU ---
import AllTicketsPage from "./pages/support/AllTicketsPage";
import OpenTicketsPage from "./pages/support/OpenTicketsPage";
import ViewTicket from "./pages/support/ViewTicket";

// --- ACCOUNT SUB-MENU ---
import MyProfilePage from "./pages/account/MyProfilePage";
import SecurityPage from "./pages/account/SecurityPage"; // Assuming this is for Account Security
import AccountPaymentMethodsPage from "./pages/account/AccountPaymentMethodsPage";
import EmailPrefsPage from "./pages/account/EmailPrefsPage";

// --- MODULES 3-6 (CLIENT) ---
import ServiceDetailPage from "./pages/services/ServiceDetailPage";
import VpsPanelPage from "./pages/services/VpsPanelPage";
import DomainSearchPage from "./pages/domains/DomainSearchPage";
import DomainRegisterPage from "./pages/domains/DomainRegisterPage";
import DomainTransferPage from "./pages/domains/DomainTransferPage";
import DomainTransfersPage from "./pages/domains/DomainTransfersPage";
import DomainDetailPage from "./pages/domains/DomainDetailPage";
import ClientKycPage from "./pages/kyc/ClientKycPage";
import CreateTicketPage from "./pages/support/CreateTicketPage";
import ClientTicketPage from "./pages/support/ClientTicketPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import KbArticlePage from "./pages/KbArticlePage";
import SearchPage from "./pages/SearchPage";
import NotificationsPage from "./pages/NotificationsPage";


const queryClient = new QueryClient();

// Protected Route Wrapper Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-slate-600">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const StaffRoute = ({ children }: { children: React.ReactNode }) => {
  const isStaff = useIsStaff();
  if (!isStaff) {
    return <Navigate to="/client-dashboard" replace />;
  }
  return <>{children}</>;
};

const ClientRoute = ({ children }: { children: React.ReactNode }) => {
  const isClient = useIsClient();
  if (!isClient) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Default route redirects to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/admin" element={<Navigate to="/login" replace />} />
      
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin/create" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* ========================================================= */}
      {/* GUVIHOST APP ROUTES                                       */}
      {/* ========================================================= */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/client-dashboard" element={<ProtectedRoute><DashboardClientPage /></ProtectedRoute>} />
      
      {/* Clients */}
      <Route path="/clients/all" element={<ProtectedRoute><StaffRoute><AllClientsPage /></StaffRoute></ProtectedRoute>} />
      <Route path="/clients/add" element={<ProtectedRoute><StaffRoute><AddClientPage /></StaffRoute></ProtectedRoute>} />
      <Route path="/clients/edit/:id" element={<ProtectedRoute><StaffRoute><EditClientPage /></StaffRoute></ProtectedRoute>} />
      <Route path="/clients/kyc" element={<ProtectedRoute><StaffRoute><KYCPage /></StaffRoute></ProtectedRoute>} />
      <Route path="/clients/kyc-verification" element={<ProtectedRoute><StaffRoute><KYCVerification /></StaffRoute></ProtectedRoute>} />
      <Route path="/clients/notes" element={<ProtectedRoute><StaffRoute><ClientNotesPage /></StaffRoute></ProtectedRoute>} />
      <Route path="/clients/login" element={<ProtectedRoute><StaffRoute><LoginAsClientPage /></StaffRoute></ProtectedRoute>} />
      
      {/* Services & Modules */}
      <Route path="/services/all" element={<ProtectedRoute><AllServicesPage /></ProtectedRoute>} />
      <Route path="/domains" element={<ProtectedRoute><DomainsPage /></ProtectedRoute>} />
      <Route path="/hosting" element={<ProtectedRoute><HostingPage /></ProtectedRoute>} /> 
      <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
      <Route path="/support" element={<ProtectedRoute><SupportTicketsPage /></ProtectedRoute>} />
      <Route path="/servers" element={<ProtectedRoute><StaffRoute><ServersPage /></StaffRoute></ProtectedRoute>} />
      <Route path="/automation" element={<ProtectedRoute><StaffRoute><AutomationPage /></StaffRoute></ProtectedRoute>} />

      {/* Management & Settings */}
      <Route path="/reports" element={<ProtectedRoute><StaffRoute><ReportsPage /></StaffRoute></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute><StaffRoute><StaffManagementPage /></StaffRoute></ProtectedRoute>} />
      <Route path="/staff/new" element={<ProtectedRoute><StaffRoute><CreateStaffPage /></StaffRoute></ProtectedRoute>} />
      <Route path="/staff/:id" element={<ProtectedRoute><StaffRoute><StaffDetailPage /></StaffRoute></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><StaffRoute><SettingsPage /></StaffRoute></ProtectedRoute>} />
      <Route path="/api" element={<ProtectedRoute><StaffRoute><APIIntegrationsPage /></StaffRoute></ProtectedRoute>} />

      {/* Admin quotes & KB */}
      <Route path="/admin/quotes" element={<ProtectedRoute><StaffRoute><AdminQuotesPage /></StaffRoute></ProtectedRoute>} />
      <Route path="/admin/quotes/:id" element={<ProtectedRoute><StaffRoute><AdminQuoteDetailPage /></StaffRoute></ProtectedRoute>} />
      <Route path="/admin/kb" element={<ProtectedRoute><StaffRoute><AdminKbPage /></StaffRoute></ProtectedRoute>} />

      {/* Client quotes & affiliates */}
      <Route path="/quotes" element={<ProtectedRoute><ClientRoute><ClientQuotesPage /></ClientRoute></ProtectedRoute>} />
      <Route path="/affiliates" element={<ProtectedRoute><ClientRoute><AffiliatesPage /></ClientRoute></ProtectedRoute>} />
      <Route path="/security" element={<ProtectedRoute><SecurityPage /></ProtectedRoute>} />
      

      {/* Services */}
      <Route path="/services/order" element={<ProtectedRoute><OrderServicePage /></ProtectedRoute>} />
      <Route path="/services/shared" element={<ProtectedRoute><SharedHostingPage /></ProtectedRoute>} />
      <Route path="/services/vps" element={<ProtectedRoute><VPSHostingPage /></ProtectedRoute>} />
      <Route path="/services/dedicated" element={<ProtectedRoute><DedicatedServersPage /></ProtectedRoute>} />
      <Route path="/services/email" element={<ProtectedRoute><EmailServicesPage /></ProtectedRoute>} />

      {/* Billing */}
      <Route path="/billing/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
      <Route path="/billing/invoices/:id" element={<ProtectedRoute><InvoiceDetailPage /></ProtectedRoute>} />
      <Route path="/billing/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
      <Route path="/billing/methods" element={<ProtectedRoute><PaymentMethodsPage /></ProtectedRoute>} />
      <Route path="/billing/add-funds" element={<ProtectedRoute><AddFundsPage /></ProtectedRoute>} />

      {/* Client Commerce */}
      <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      <Route path="/my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />

      {/* Support */}
      <Route path="/support/all" element={<ProtectedRoute><AllTicketsPage /></ProtectedRoute>} />
      <Route path="/support/open" element={<ProtectedRoute><OpenTicketsPage /></ProtectedRoute>} />
      <Route path="/support/view" element={<ProtectedRoute><ViewTicket /></ProtectedRoute>} />

      {/* Account */}
      <Route path="/account/profile" element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />
      <Route path="/account/security" element={<ProtectedRoute><SecurityPage /></ProtectedRoute>} />
      <Route path="/account/payment-methods" element={<ProtectedRoute><AccountPaymentMethodsPage /></ProtectedRoute>} />
      <Route path="/account/email-prefs" element={<ProtectedRoute><EmailPrefsPage /></ProtectedRoute>} />
      <Route path="/account/kyc" element={<ProtectedRoute><ClientKycPage /></ProtectedRoute>} />

      {/* Client services & domains (Modules 3-4) */}
      <Route path="/services/:id" element={<ProtectedRoute><ServiceDetailPage /></ProtectedRoute>} />
      <Route path="/services/:id/vps" element={<ProtectedRoute><VpsPanelPage /></ProtectedRoute>} />
      <Route path="/domains/search" element={<ProtectedRoute><DomainSearchPage /></ProtectedRoute>} />
      <Route path="/domains/register" element={<ProtectedRoute><DomainRegisterPage /></ProtectedRoute>} />
      <Route path="/domains/transfer" element={<ProtectedRoute><DomainTransferPage /></ProtectedRoute>} />
      <Route path="/domains/transfers" element={<ProtectedRoute><DomainTransfersPage /></ProtectedRoute>} />
      <Route path="/domains/:id" element={<ProtectedRoute><DomainDetailPage /></ProtectedRoute>} />

      {/* Support, KB, search, notifications (Modules 5-6) */}
      <Route path="/support/create" element={<ProtectedRoute><CreateTicketPage /></ProtectedRoute>} />
      <Route path="/support/tickets/:id" element={<ProtectedRoute><ClientTicketPage /></ProtectedRoute>} />
      <Route path="/kb" element={<ProtectedRoute><KnowledgeBasePage /></ProtectedRoute>} />
      <Route path="/kb/:slug" element={<ProtectedRoute><KbArticlePage /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />


      {/* 404 Catch-all redirects to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* AuthProvider must be inside BrowserRouter to use navigate() */}
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;