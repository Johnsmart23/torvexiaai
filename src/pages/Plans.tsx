import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PlanCard from "@/components/PlanCard";
import { useInvestmentPlans } from "@/hooks/use-investment-plans";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amount);

const Plans = () => {
  const { plans, loading } = useInvestmentPlans();

  return (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="container mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">Investment Plans</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
          Choose a plan that matches your investment goals. Profits continue until paused by an administrator.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {loading ? (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Loading investment plans...</p>
        ) : plans.length > 0 ? (
          plans.map((plan, index) => (
            <PlanCard key={plan.id} plan={plan} highlighted={index === 1} />
          ))
        ) : (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            No investment plans are currently available.
          </p>
        )}
      </div>

      {/* Comparison table */}
      {!loading && plans.length > 0 && <div className="mt-16 mx-auto max-w-5xl overflow-x-auto">
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Plan Comparison</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="py-3 px-4 text-left text-sm font-semibold text-foreground">Feature</th>
              {plans.map((plan, index) => (
                <th key={plan.id} className={`py-3 px-4 text-center text-sm font-semibold ${index === 1 ? "text-primary" : "text-foreground"}`}>
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm">
            {[
              { feature: "Daily Profit", value: (plan: typeof plans[number]) => `${plan.daily_rate}%` },
              { feature: "Minimum Deposit", value: (plan: typeof plans[number]) => formatCurrency(plan.min_deposit) },
              { feature: "Maximum Deposit", value: (plan: typeof plans[number]) => plan.max_deposit === null ? "No limit" : formatCurrency(plan.max_deposit) },
              { feature: "Referral Bonus", value: (plan: typeof plans[number]) => `${plan.referral_bonus}%` },
            ].map(({ feature, value }) => (
              <tr key={feature} className="border-b border-border">
                <td className="py-3 px-4 text-muted-foreground">{feature}</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="py-3 px-4 text-center text-foreground">{value(plan)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
    <Footer />
  </div>
  );
};

export default Plans;
