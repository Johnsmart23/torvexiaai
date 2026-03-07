import { motion } from "framer-motion";
import { Star } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";

const testimonials = [
  { name: "Sarah M.", role: "Early Investor", text: "VaultEdge transformed my savings strategy. Watching daily profits roll in gives me real confidence in my financial future.", rating: 5 },
  { name: "James K.", role: "Business Owner", text: "The transparency is unmatched. I can see every transaction, every profit accrual. No hidden fees, no surprises.", rating: 5 },
  { name: "Amara O.", role: "Freelancer", text: "I started with the Bronze plan and upgraded to Gold within 2 months. The returns speak for themselves.", rating: 5 },
  { name: "David L.", role: "Retiree", text: "After years of low bank interest rates, VaultEdge finally gives me a meaningful return on my capital.", rating: 4 },
  { name: "Priya S.", role: "Software Engineer", text: "KYC verification was quick and seamless. The security measures gave me peace of mind from day one.", rating: 5 },
  { name: "Michael R.", role: "Entrepreneur", text: "The referral program is generous. I've earned significant bonuses just by sharing with friends and family.", rating: 5 },
  { name: "Linda W.", role: "Teacher", text: "Simple, intuitive dashboard. I check my daily interest every morning with my coffee. It's become my favorite routine.", rating: 4 },
  { name: "Hassan A.", role: "Trader", text: "I've used many platforms. VaultEdge stands out for its reliability and consistent daily payouts.", rating: 5 },
  { name: "Emily C.", role: "Nurse", text: "Customer support is exceptional. Every question I had was answered within hours. Truly professional team.", rating: 5 },
  { name: "Robert T.", role: "Accountant", text: "The financial reports and transaction history make my tax season much easier. Everything is well-documented.", rating: 4 },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0, 0, 0.2, 1] } },
};

const Testimonials = () => (
  <section className="container mx-auto px-4 py-20">
    <AnimatedSection>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground">What Our Investors Say</h2>
        <p className="mt-2 text-muted-foreground">Trusted by thousands of investors worldwide</p>
      </div>
    </AnimatedSection>

    <motion.div
      className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      variants={stagger}
    >
      {testimonials.map((t) => (
        <motion.div
          key={t.name}
          variants={cardVariant}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="rounded-xl border border-border bg-card p-5 shadow-card cursor-default"
        >
          <div className="flex gap-0.5 mb-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < t.rating ? "fill-warning text-warning" : "text-muted"}`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {t.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.role}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  </section>
);

export default Testimonials;
