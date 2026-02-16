import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "How does VaultEdge generate profits?", a: "VaultEdge employs professional investment strategies across diversified markets. Returns are calculated daily and credited to your profit wallet automatically." },
  { q: "Is my investment safe?", a: "We implement bank-grade 256-bit encryption, KYC verification, manual withdrawal approvals, and 24/7 anti-fraud monitoring. All transactions are ledger-based for full auditability." },
  { q: "How do I deposit funds?", a: "You can deposit via bank transfer (USD) or cryptocurrency (USDT). Deposits require admin approval before funds appear in your wallet." },
  { q: "When can I withdraw my capital?", a: "Capital is returned at the end of your investment plan (30 days). Daily profits can be withdrawn or reinvested at any time after KYC verification." },
  { q: "What is KYC verification?", a: "Know Your Customer (KYC) requires submitting your ID card and a selfie. This is mandatory for withdrawals and protects both you and the platform." },
  { q: "How does the referral program work?", a: "You earn 10% commission on every deposit made by users you refer. Commissions are credited instantly after deposit approval." },
  { q: "Can I reinvest my profits?", a: "Yes, you can reinvest your profits at any time into any available plan. Reinvestments are tracked separately in your dashboard." },
  { q: "What currencies are supported?", a: "We support USD (fiat) and USDT (crypto). All balances are stored in USD equivalent and displayed in both currencies." },
];

const FAQ = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold text-foreground text-center">Frequently Asked Questions</h1>
        <p className="mt-3 text-center text-muted-foreground">
          Find answers to the most common questions about our platform.
        </p>
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-foreground">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
    <Footer />
  </div>
);

export default FAQ;
