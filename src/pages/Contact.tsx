import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast({ title: "Message sent", description: "We'll get back to you within 24 hours." });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold text-foreground text-center">Contact Us</h1>
          <p className="mt-3 text-center text-muted-foreground">
            Have a question? Our support team is here to help.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5 shadow-card flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Email Support</h3>
                <p className="text-sm text-muted-foreground">support@vaultedge.com</p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-card flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Live Chat</h3>
                <p className="text-sm text-muted-foreground">Available 24/7</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Your name" required />
              <Input type="email" placeholder="Your email" required />
            </div>
            <Input placeholder="Subject" required />
            <Textarea placeholder="Describe your issue or question..." rows={5} required />
            <Button type="submit" disabled={sending} className="w-full">
              {sending ? "Sending..." : "Submit Ticket"}
            </Button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
