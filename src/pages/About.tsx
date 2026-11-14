import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Target, Eye, AlertTriangle } from "lucide-react";

const About = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-foreground">About TorvexiaAI</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          TorvexiaAI is a professional investment management platform designed to provide transparent,
          secure, and accessible wealth-building opportunities for investors worldwide.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <Target className="h-8 w-8 text-primary mb-3" />
            <h3 className="text-lg font-semibold text-foreground">Our Mission</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              To democratize professional investment management, making consistent daily returns 
              accessible to everyone through a secure, transparent, and auditable platform.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <Eye className="h-8 w-8 text-primary mb-3" />
            <h3 className="text-lg font-semibold text-foreground">Our Vision</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              To become the most trusted investment platform globally, known for integrity, 
              security, and consistent performance.
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-warning/30 bg-warning/5 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-foreground">Risk Disclaimer</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                All investments carry risk. Past performance does not guarantee future results. 
                Invest only what you can afford to lose. TorvexiaAI provides tools and management
                services but cannot guarantee returns. Please read our full risk disclosure before investing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default About;
