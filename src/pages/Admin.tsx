import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Users,
  DollarSign,
  BarChart3,
  LogOut,
  Menu,
  CheckSquare,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import AdminFinanceDashboard from "@/components/admin/AdminFinanceDashboard";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminPlanManagement from "@/components/admin/AdminPlanManagement";
import AdminTransactionApproval from "@/components/admin/AdminTransactionApproval";
import AdminPaymentMethodManagement from "@/components/admin/AdminPaymentMethodManagement";
import AdminProfitControl from "@/components/admin/AdminProfitControl";
import AdminManagement from "@/components/admin/AdminManagement";
import ThemeModeToggle from "@/components/ThemeModeToggle";

const baseTabs = [
  { key: "dashboard" as const, label: "Dashboard", icon: DollarSign },
  { key: "users" as const, label: "Users", icon: Users },
  { key: "approvals" as const, label: "Approvals", icon: CheckSquare },
  { key: "plans" as const, label: "Plans", icon: BarChart3 },
  { key: "payment-methods" as const, label: "Payment Methods", icon: Wallet },
  { key: "profits" as const, label: "Profit Control", icon: TrendingUp },
];

const superAdminTab = { key: "admins" as const, label: "Admins", icon: Shield };
type TabKey = (typeof baseTabs)[number]["key"] | "admins";

const Admin = () => {
  const { signOut } = useAuth();
  const { isSuperAdmin } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const tabs = isSuperAdmin ? [...baseTabs, superAdminTab] : baseTabs;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive">
              <Shield className="h-4 w-4 text-destructive-foreground" />
            </div>
            <span className="font-bold text-foreground">Admin Panel</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <ThemeModeToggle compact />
            </div>
            <Link to="/dashboard" className="hidden sm:block">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <Button className="hidden sm:inline-flex" variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Open admin menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:hidden">
                <SheetHeader>
                  <SheetTitle>Admin Menu</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-2">
                  <ThemeModeToggle className="justify-start px-3" />
                  {tabs.map((tab) => (
                    <SheetClose asChild key={tab.key}>
                      <Button
                        variant={activeTab === tab.key ? "secondary" : "ghost"}
                        className="justify-start px-3"
                        onClick={() => setActiveTab(tab.key)}
                      >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                      </Button>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Link to="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                      <Shield className="h-4 w-4" /> User Dashboard
                    </Link>
                  </SheetClose>
                  <Button
                    variant="ghost"
                    className="justify-start px-3"
                    onClick={async () => { await signOut(); navigate("/"); }}
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "dashboard" && <AdminFinanceDashboard />}
        {activeTab === "users" && <AdminUserManagement />}
        {activeTab === "approvals" && <AdminTransactionApproval />}
        {activeTab === "plans" && <AdminPlanManagement />}
        {activeTab === "payment-methods" && <AdminPaymentMethodManagement />}
        {activeTab === "profits" && <AdminProfitControl />}
        {activeTab === "admins" && isSuperAdmin && <AdminManagement />}
      </div>
    </div>
  );
};

export default Admin;
