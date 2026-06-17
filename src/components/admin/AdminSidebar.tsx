import { useState } from "react";
import { 
  LayoutGrid, 
  User, 
  Globe, 
  HardDrive, 
  Receipt, 
  ShoppingCart, 
  Headset, 
  Database, 
  Rocket, 
  LineChart, 
  UserCog, Users ,
  Settings, 
  Lock, 
  ShieldCheck, FileText, Package, BookOpen,
  ChevronDown,
  LogOut 
} from "lucide-react";
import { NavLink as RouterNavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/lib/auth";
import { useDisplayUser, useIsClient } from "@/hooks/use-role";
import {
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent,
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarHeader, 
  SidebarFooter, 
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { NavLink } from "@/components/NavLink"; 

interface NavSubItem {
  title: string;
  url: string;
  roles?: UserRole[];
}

interface NavItem {
  title: string;
  url: string;
  icon: any;
  badge?: string;
  roles?: UserRole[];
  subItems?: NavSubItem[];
}

const ADMIN_ONLY: UserRole[] = ["admin"];
const ALL_STAFF: UserRole[] = ["admin", "support"];

const staffMenuItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutGrid, roles: ADMIN_ONLY },
  { title: "Client Dashboard", url: "/client-dashboard", icon: LayoutGrid, roles: ADMIN_ONLY },
  {
    title: "Clients",
    url: "/clients",
    icon: User,
    roles: ADMIN_ONLY,
    subItems: [
      { title: "All Clients", url: "/clients/all" },
      { title: "Add Client", url: "/clients/add" },
      { title: "Login as Client", url: "/clients/login" },
      { title: "KYC", url: "/clients/kyc" },
      { title: "KYC Verification", url: "/clients/kyc-verification" },
      { title: "Client Notes", url: "/clients/notes" },
    ],
  },
  {
    title: "Services",
    url: "/services",
    icon: HardDrive,
    roles: ADMIN_ONLY,
    subItems: [
      { title: "All Services", url: "/services/all" },
      { title: "Shared Hosting", url: "/services/shared" },
      { title: "VPS Hosting", url: "/services/vps" },
      { title: "Dedicated Servers", url: "/services/dedicated" },
    ],
  },
  { title: "Domains", url: "/domains", icon: Globe, roles: ADMIN_ONLY },
  { title: "Hosting", url: "/hosting", icon: HardDrive, roles: ADMIN_ONLY },
  {
    title: "Billing",
    url: "/billing",
    icon: Receipt,
    roles: ADMIN_ONLY,
    subItems: [
      { title: "Invoices", url: "/billing/invoices" },
      { title: "Transactions", url: "/billing/transactions" },
      { title: "Payment Methods", url: "/billing/methods" },
      { title: "Add Funds", url: "/billing/add-funds" },
    ],
  },
  {
    title: "Support Tickets",
    url: "/support",
    icon: Headset,
    roles: ALL_STAFF,
    subItems: [
      { title: "All Tickets", url: "/support/all" },
      { title: "Open Tickets", url: "/support/open" },
      { title: "View Tickets", url: "/support/view" },
    ],
  },
  { title: "Quotes", url: "/admin/quotes", icon: FileText, roles: ADMIN_ONLY },
  { title: "Knowledge Base", url: "/admin/kb", icon: BookOpen, roles: ADMIN_ONLY },
  { title: "Orders", url: "/orders", icon: ShoppingCart, roles: ADMIN_ONLY },
  { title: "Servers", url: "/servers", icon: Database, roles: ADMIN_ONLY },
  { title: "Automation", url: "/automation", icon: Rocket, roles: ADMIN_ONLY },
  { title: "Reports", url: "/reports", icon: LineChart, roles: ADMIN_ONLY },
  { title: "Staff Management", url: "/staff", icon: UserCog, roles: ADMIN_ONLY },
  {
    title: "Account",
    url: "/account",
    icon: User,
    roles: ADMIN_ONLY,
    subItems: [
      { title: "My Profile", url: "/account/profile" },
      { title: "Security", url: "/account/security" },
      { title: "Payment Methods", url: "/account/payment-methods" },
      { title: "Email Preferences", url: "/account/email-prefs" },
    ],
  },
  { title: "Settings", url: "/settings", icon: Settings, roles: ADMIN_ONLY },
  { title: "API Integrations", url: "/api", icon: Lock, roles: ADMIN_ONLY },
];

const clientMenuItems: NavItem[] = [
  { title: "Dashboard", url: "/client-dashboard", icon: LayoutGrid },
  {
    title: "Services",
    url: "/services",
    icon: HardDrive,
    subItems: [
      { title: "All Services", url: "/services/all" },
      { title: "Shared Hosting", url: "/services/shared" },
      { title: "VPS Hosting", url: "/services/vps" },
      { title: "Dedicated Servers", url: "/services/dedicated" },
    ],
  },
  { title: "Domains", url: "/domains", icon: Globe },
  { title: "Hosting", url: "/hosting", icon: HardDrive },
  {
    title: "Billing",
    url: "/billing",
    icon: Receipt,
    subItems: [
      { title: "Invoices", url: "/billing/invoices" },
      { title: "Transactions", url: "/billing/transactions" },
      { title: "Payment Methods", url: "/billing/methods" },
      { title: "Add Funds", url: "/billing/add-funds" },
    ],
  },
  {
    title: "Support",
    url: "/support",
    icon: Headset,
    subItems: [
      { title: "Create Ticket", url: "/support/create" },
      { title: "All Tickets", url: "/support/all" },
    ],
  },
  { title: "Cart", url: "/cart", icon: ShoppingCart },
  { title: "My Orders", url: "/my-orders", icon: Package },
  { title: "Quotes", url: "/quotes", icon: FileText },
  { title: "Affiliates", url: "/affiliates", icon: Users },
  { title: "Knowledge Base", url: "/kb", icon: BookOpen },
  {
    title: "Account",
    url: "/account",
    icon: User,
    subItems: [
      { title: "My Profile", url: "/account/profile" },
      { title: "Security", url: "/account/security" },
      { title: "Payment Methods", url: "/account/payment-methods" },
      { title: "Email Preferences", url: "/account/email-prefs" },
      { title: "KYC Verification", url: "/account/kyc" },
    ],
  },
];

const ROLE_COLORS: Record<UserRole | "client", string> = {
  admin: "bg-blue-100 text-blue-700",
  finance: "bg-emerald-100 text-emerald-700",
  sales: "bg-purple-100 text-purple-700",
  support: "bg-amber-100 text-amber-700",
  client: "bg-slate-100 text-slate-700",
};

const ROLE_LABELS: Record<UserRole | "client", string> = {
  admin: "Admin",
  finance: "Finance",
  sales: "Sales",
  support: "Support",
  client: "Client",
};

function canAccessNavItem(roles: UserRole[] | undefined, userRole: UserRole): boolean {
  if (!roles) return userRole === "admin";
  if (userRole === "admin") return true;
  return roles.includes(userRole);
}

function NavCollapsibleItem({
  item,
  collapsed,
  userRole,
}: {
  item: NavItem;
  collapsed: boolean;
  userRole: UserRole;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const isGroupActive = location.pathname.startsWith(item.url);
  const visibleSubItems = item.subItems?.filter((sub) => canAccessNavItem(sub.roles, userRole)) ?? [];

  if (visibleSubItems.length === 0) return null;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => setIsOpen(!isOpen)}
        tooltip={collapsed ? item.title : undefined}
        className={cn(
          "flex items-center justify-between w-full rounded-lg py-2.5 px-3 text-[17px] font-medium transition-all duration-200 cursor-pointer",
          isGroupActive && !isOpen
            ? "text-blue-700 bg-blue-50/50" 
            : "text-slate-600 hover:text-blue-700 hover:bg-blue-50"
        )}
      >
        <div className="flex items-center gap-3">
          <item.icon className="h-[20px] w-[20px] shrink-0 text-slate-500" />
          {!collapsed && <span className="text-slate-700">{item.title}</span>}
        </div>
        {!collapsed && (
          <div className="flex items-center gap-2">
            {item.badge && (
              <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
            <ChevronDown className={cn("h-4 w-4 transition-transform text-slate-400", !isOpen && "-rotate-90")} />
          </div>
        )}
      </SidebarMenuButton>

      {/* FIXED TEXT SIZE FOR SUB ITEMS HERE */}
      {isOpen && !collapsed && visibleSubItems.length > 0 && (
        <div className="flex flex-col mt-2 ml-5 pl-4 border-l border-slate-200 space-y-2.5">
          {visibleSubItems.map(subItem => (
            <NavLink
              key={subItem.url}
              to={subItem.url}
              className={({ isActive }: any) => cn(
                "block text-sm transition-colors duration-200 relative", 
                isActive 
                  ? "text-slate-900 font-medium" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <span className="tracking-wide">{subItem.title}</span>
            </NavLink>
          ))}
        </div>
      )}
    </SidebarMenuItem>
  );
}

interface NavGroupProps {
  label?: string;
  items: NavItem[];
  collapsed: boolean;
  userRole: UserRole;
}

function NavGroup({ label, items, collapsed, userRole }: NavGroupProps) {
  const filteredItems = items.filter((item) => canAccessNavItem(item.roles, userRole));

  if (filteredItems.length === 0) return null;

  return (
    <SidebarGroup className="mt-2">
      {!collapsed && label && (
        <SidebarGroupLabel className="text-slate-400 text-[10px] uppercase tracking-[0.1em] font-semibold mb-1 px-3">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1">
          {filteredItems.map((item) => (
            item.subItems ? (
              <NavCollapsibleItem key={item.title} item={item} collapsed={collapsed} userRole={userRole} />
            ) : (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                  <NavLink 
                    to={item.url} 
                    end={item.url === "/dashboard" || item.url === "/client-dashboard"}
                    className={cn(
                      "flex items-center justify-between rounded-lg py-2.5 text-[17px] font-medium transition-all duration-200 w-full",
                      collapsed ? "px-3 justify-center" : "px-3",
                      "text-slate-600 hover:text-blue-700 hover:bg-blue-50"
                    )}
                    activeClassName="bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-[20px] w-[20px] shrink-0 text-slate-500" />
                      {!collapsed && <span className="text-slate-700">{item.title}</span>}
                    </div>
                    {!collapsed && item.badge && (
                      <span className="bg-[#1b5df9] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, logout } = useAuth();
  const displayUser = useDisplayUser();
  const isClient = useIsClient();
  const navigate = useNavigate();
  const role = user?.role || "admin";
  const menuItems = isClient ? clientMenuItems : staffMenuItems;
  const profileRole: UserRole | "client" = user?.role ?? (isClient ? "client" : "admin");
  const profileLabel = ROLE_LABELS[profileRole];

  const handleLogout = async () => { 
    await logout(); 
    navigate("/login", { replace: true }); 
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white shadow-sm flex flex-col h-full">
      <SidebarHeader className={cn("py-6", collapsed ? "px-2" : "px-4")}>
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-lg font-bold italic text-white">G</span>
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-[17px] font-bold text-slate-900 tracking-tight leading-tight">
                GUVIHOST <span className="font-light text-slate-500">ERP</span>
              </h2>
              <p className="text-[10px] text-blue-500 font-medium tracking-wide uppercase mt-0.5">Cloud • Solutions</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 gap-0 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
        <NavGroup items={menuItems} collapsed={collapsed} userRole={role} />
      </SidebarContent>

      {/* {!collapsed && (
        <div className="px-4 py-4 mt-auto">
          <div className="bg-[#1b5df9] rounded-xl p-4 text-white shadow-md shadow-blue-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 p-2 rounded-full">
                <Headset className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide">24/7 Support</p>
                <p className="text-xs text-blue-100 font-medium">We're here to help</p>
              </div>
            </div>
            <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
              Create Ticket
            </button>
          </div>
        </div>
      )} */}

      <SidebarFooter className={cn("py-4 border-t border-slate-100 shrink-0", collapsed ? "px-2" : "px-4")}>
        <div className={cn("flex items-center", collapsed ? "flex-col gap-3" : "gap-3")}>
          <div className="h-9 w-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-blue-700">
              {displayUser?.name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800 truncate">{displayUser?.name ?? "User"}</p>
                <Badge className={cn("text-[9px] px-1.5 py-0 h-4 border-0 capitalize font-medium tracking-wide", ROLE_COLORS[profileRole])}>
                  {profileLabel}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{displayUser?.email ?? ""}</p>
            </div>
          )}
          <button 
            onClick={handleLogout} 
            className="text-slate-400 hover:text-red-600 transition-colors bg-slate-50 hover:bg-red-50 p-2 rounded-lg" 
            title="Logout"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}