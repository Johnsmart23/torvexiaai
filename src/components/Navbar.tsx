import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Shield, LayoutDashboard, LogOut, User, ShieldCheck } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-profile";
import { useAdmin } from "@/hooks/use-admin";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Plans", path: "/plans" },
  { label: "FAQ", path: "/faq" },
  { label: "Security", path: "/security" },
  { label: "Contact", path: "/contact" },
];

const AvatarBubble = ({ avatarUrl, initials }: { avatarUrl: string | null; initials: string }) => (
  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 overflow-hidden shrink-0">
    {avatarUrl ? (
      <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
    ) : (
      <span className="text-xs font-bold text-primary">{initials}</span>
    )}
  </div>
);

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const profile = useProfile();
  const { isAdmin } = useAdmin();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setMobileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary"
          >
            <Shield className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <span className="text-xl font-bold text-foreground">TorvexiaAI</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
              {location.pathname === link.path && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded-lg bg-secondary -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-1" />Dashboard
                </Link>
              </Button>
              {isAdmin && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin">
                    <ShieldCheck className="h-4 w-4 mr-1" />Admin
                  </Link>
                </Button>
              )}
              <NotificationBell />
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full border border-border px-2 py-1 hover:bg-secondary transition-colors"
              >
                <AvatarBubble avatarUrl={profile?.avatar_url ?? null} initials={initials} />
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border bg-card md:hidden"
          >
            <div className="px-4 pb-4">
              {/* User info strip for mobile */}
              {user && (
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 mb-1 hover:bg-secondary transition-colors"
                >
                  <AvatarBubble avatarUrl={profile?.avatar_url ?? null} initials={initials} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || "My Profile"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </Link>
              )}
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                    location.pathname === link.path
                      ? "bg-secondary text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 flex gap-2">
                {user ? (
                  <>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                        <LayoutDashboard className="h-4 w-4 mr-1" />Dashboard
                      </Link>
                    </Button>
                    {isAdmin && (
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link to="/admin" onClick={() => setMobileOpen(false)}>
                          <ShieldCheck className="h-4 w-4 mr-1" />Admin
                        </Link>
                      </Button>
                    )}
                    <Button size="sm" className="flex-1" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-1" />Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
                    </Button>
                    <Button size="sm" className="flex-1" asChild>
                      <Link to="/register" onClick={() => setMobileOpen(false)}>Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
