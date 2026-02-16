import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PlanCard from "@/components/PlanCard";

const plans = [
  {
    name: "Bronze",
    dailyProfit: "1%",
    duration: "30 days",
    capitalReturn: "at maturity",
    features: ["Min. deposit $100", "Daily profit accrual", "Capital returned at end of plan", "Standard support", "Reinvestment allowed"],
  },
  {
    name: "Silver",
    dailyProfit: "2.5%",
    duration: "30 days",
    capitalReturn: "at maturity",
    features: ["Min. deposit $500", "Higher daily returns", "Capital returned at end of plan", "Priority support", "Reinvestment allowed"],
    highlighted: true,
  },
  {
    name: "Gold",
    dailyProfit: "4%",
    duration: "30 days",
    capitalReturn: "at maturity",
    features: ["Min. deposit $1,000", "Maximum daily returns", "Capital returned at end of plan", "VIP dedicated support", "Exclusive investor benefits"],
  },
];

const Plans = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="container mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">Investment Plans</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
          Choose the plan that matches your investment goals. All plans run for 30 days with daily profit accrual.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <PlanCard key={plan.name} {...plan} />
        ))}
      </div>

      {/* Comparison table */}
      <div className="mt-16 mx-auto max-w-3xl overflow-x-auto">
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Plan Comparison</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="py-3 px-4 text-left text-sm font-semibold text-foreground">Feature</th>
              <th className="py-3 px-4 text-center text-sm font-semibold text-foreground">Bronze</th>
              <th className="py-3 px-4 text-center text-sm font-semibold text-primary">Silver</th>
              <th className="py-3 px-4 text-center text-sm font-semibold text-foreground">Gold</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {[
              ["Daily Profit", "1%", "2.5%", "4%"],
              ["Duration", "30 days", "30 days", "30 days"],
              ["Capital Return", "End of plan", "End of plan", "End of plan"],
              ["Min. Deposit", "$100", "$500", "$1,000"],
              ["Reinvestment", "Yes", "Yes", "Yes"],
              ["Support Level", "Standard", "Priority", "VIP"],
            ].map(([feature, ...values]) => (
              <tr key={feature} className="border-b border-border">
                <td className="py-3 px-4 text-muted-foreground">{feature}</td>
                {values.map((v, i) => (
                  <td key={i} className="py-3 px-4 text-center text-foreground">{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <Footer />
  </div>
);

export default Plans;
