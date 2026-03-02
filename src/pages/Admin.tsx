import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Users,
  DollarSign,
  BarChart3,
  LogOut,
  CheckSquare,
} from "lucide-react";
import AdminFinanceDashboard from "@/components/admin/AdminFinanceDashboard";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminPlanManagement from "@/components/admin/AdminPlanManagement";
import AdminTransactionApproval from "@/components/admin/AdminTransactionApproval";

const tabs = [
  { key: "dashboard" as const, label: "Dashboard", icon: DollarSign },
  { key: "users" as const, label: "Users", icon: Users },
  { key: "approvals" as const, label: "Approvals", icon: CheckSquare },
  { key: "plans" as const, label: "Plans", icon: BarChart3 },
];

type TabKey = (typeof tabs)[number]["key"];

const Admin = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

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
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
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
      </div>
    </div>
  );
};

export default Admin;
