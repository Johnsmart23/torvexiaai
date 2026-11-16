import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { buildSupportMailto } from "@/lib/support-email";

const Contact = () => {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    window.location.href = buildSupportMailto({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      message: String(formData.get("message") ?? ""),
    });
    toast({
      title: "Email draft ready",
      description: "Your email app should open with your message. Send the draft to contact support.",
    });
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
                <p className="text-sm text-muted-foreground">torvexiaai@gmail.com</p>
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
              <Input name="name" placeholder="Your name" required />
              <Input name="email" type="email" placeholder="Your email" required />
            </div>
            <Input name="subject" placeholder="Subject" required />
            <Textarea name="message" placeholder="Describe your issue or question..." rows={5} required />
            <Button type="submit" className="w-full">
              Email Support
            </Button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
