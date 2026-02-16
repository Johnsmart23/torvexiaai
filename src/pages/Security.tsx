import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Lock, Fingerprint, Eye, AlertTriangle, Server } from "lucide-react";

const features = [
  { icon: Lock, title: "256-bit Encryption", desc: "All data transmitted and stored is protected with bank-grade AES-256 encryption." },
  { icon: Fingerprint, title: "KYC Verification", desc: "Identity verification via ID card and selfie is required before any withdrawal." },
  { icon: Eye, title: "Anti-Fraud Monitoring", desc: "24/7 automated and manual monitoring detects and prevents suspicious activity." },
  { icon: Shield, title: "Manual Withdrawal Approval", desc: "Every withdrawal is reviewed and approved manually by our security team." },
  { icon: AlertTriangle, title: "Account Lock Protection", desc: "Accounts are automatically locked on detection of suspicious IP or device changes." },
  { icon: Server, title: "Secure Infrastructure", desc: "Hosted on enterprise cloud with SSL, rate limiting, encrypted database fields, and full transaction logs." },
];

const Security = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold text-foreground">Security & Compliance</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Your funds and data are protected by multiple layers of industry-standard security.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-card p-6 shadow-card">
            <f.icon className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold text-foreground">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
    <Footer />
  </div>
);

export default Security;
