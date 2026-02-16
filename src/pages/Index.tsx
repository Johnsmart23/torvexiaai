import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PlanCard from "@/components/PlanCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Shield,
  TrendingUp,
  Users,
  Lock,
  ArrowRight,
  CheckCircle,
  Wallet,
  BarChart3,
} from "lucide-react";

const plans = [
  {
    name: "Bronze",
    dailyProfit: "1%",
    duration: "30 days",
    capitalReturn: "at maturity",
    features: ["Min. deposit $100", "Daily profit accrual", "Capital returned at end", "24/7 monitoring"],
  },
  {
    name: "Silver",
    dailyProfit: "2.5%",
    duration: "30 days",
    capitalReturn: "at maturity",
    features: ["Min. deposit $500", "Higher daily returns", "Priority support", "Reinvestment options"],
    highlighted: true,
  },
  {
    name: "Gold",
    dailyProfit: "4%",
    duration: "30 days",
    capitalReturn: "at maturity",
    features: ["Min. deposit $1,000", "Maximum daily returns", "VIP support", "Exclusive benefits"],
  },
];

const steps = [
  { icon: Users, title: "Register & Verify", desc: "Create your account and complete KYC verification." },
  { icon: Wallet, title: "Deposit Funds", desc: "Fund your wallet via bank transfer or cryptocurrency." },
  { icon: BarChart3, title: "Choose a Plan", desc: "Select Bronze, Silver, or Gold based on your goals." },
  { icon: TrendingUp, title: "Earn Daily Profit", desc: "Watch your profits grow daily in your dashboard." },
];

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />

    {/* Hero */}
    <section className="gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoLTZ2LTZoNnptMC0zMHY2aC02VjRoNnptMzAgMzB2NmgtNnYtNmg2em0wLTMwdjZoLTZWNGg2ek02IDM0djZIMHYtNmg2em0wLTMwdjZIMFY0aDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
      <div className="container relative mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm text-primary-foreground">
            <Shield className="h-4 w-4" />
            Secure & Regulated Platform
          </div>
          <h1 className="text-4xl font-bold leading-tight text-primary-foreground md:text-6xl">
            Grow Your Wealth with{" "}
            <span className="opacity-90">Confidence</span>
          </h1>
          <p className="mt-5 text-lg text-primary-foreground/80 md:text-xl">
            Professional investment management with daily returns up to 4%. 
            Transparent, auditable, and fully secured.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button variant="accent" size="xl" asChild>
              <Link to="/register">
                Start Investing <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="xl"
              className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/plans">View Plans</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-primary-foreground/70">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> KYC Verified</span>
            <span className="flex items-center gap-1.5"><Lock className="h-4 w-4" /> 256-bit Encryption</span>
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4" /> Anti-Fraud Monitoring</span>
          </div>
        </div>
      </div>
    </section>

    {/* How it works */}
    <section className="container mx-auto px-4 py-20">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
        <p className="mt-2 text-muted-foreground">Start earning in four simple steps</p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-4">
        {steps.map((step, i) => (
          <div key={step.title} className="relative rounded-xl border border-border bg-card p-6 shadow-card text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
              <step.icon className="h-6 w-6" />
            </div>
            <div className="absolute -top-3 left-4 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
              {i + 1}
            </div>
            <h3 className="font-semibold text-foreground">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Plans */}
    <section className="bg-secondary/50 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">Investment Plans</h2>
          <p className="mt-2 text-muted-foreground">Choose the plan that fits your investment goals</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.name} {...plan} />
          ))}
        </div>
      </div>
    </section>

    {/* Security banner */}
    <section className="container mx-auto px-4 py-20">
      <div className="rounded-2xl gradient-hero p-8 md:p-12 text-center">
        <Lock className="mx-auto h-10 w-10 text-primary-foreground/80 mb-4" />
        <h2 className="text-2xl font-bold text-primary-foreground md:text-3xl">Your Security is Our Priority</h2>
        <p className="mt-3 text-primary-foreground/80 max-w-xl mx-auto">
          Industry-standard encryption, KYC verification, manual withdrawal approvals, and 24/7 anti-fraud monitoring protect every transaction.
        </p>
        <Button variant="accent" size="lg" className="mt-6" asChild>
          <Link to="/security">Learn More</Link>
        </Button>
      </div>
    </section>

    <Footer />
  </div>
);

export default Index;
