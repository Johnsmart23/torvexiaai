import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { TrendingUp } from "lucide-react";

const symbols = [
  { label: "EUR / USD", value: "OANDA:EURUSD" },
  { label: "GBP / USD", value: "OANDA:GBPUSD" },
  { label: "Gold / USD", value: "OANDA:XAUUSD" },
  { label: "Bitcoin / USDT", value: "BINANCE:BTCUSDT" },
  { label: "Ethereum / USDT", value: "BINANCE:ETHUSDT" },
  { label: "Apple", value: "NASDAQ:AAPL" },
];

const TradingViewChart = () => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [symbol, setSymbol] = useState("OANDA:EURUSD");

  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget) return;

    widget.replaceChildren();
    const chart = document.createElement("div");
    chart.className = "tradingview-widget-container__widget h-full w-full";
    widget.append(chart);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.textContent = JSON.stringify({
      allow_symbol_change: true,
      calendar: false,
      details: false,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      interval: "60",
      locale: "en",
      save_image: false,
      style: "1",
      support_host: "https://www.tradingview.com",
      symbol,
      theme: "dark",
      timezone: "Etc/UTC",
      width: "100%",
      height: "100%",
    });
    widget.append(script);

    return () => widget.replaceChildren();
  }, [symbol]);

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">TradingView Market Chart</h2>
            <p className="text-xs text-muted-foreground">Live market data provided by TradingView</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="tradingview-symbol" className="sr-only">Chart market</Label>
          <select
            id="tradingview-symbol"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            {symbols.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div
        ref={widgetRef}
        className="tradingview-widget-container h-[420px] overflow-hidden rounded-lg sm:h-[520px]"
        aria-label="Interactive TradingView price chart"
      />
      <p className="mt-3 text-xs text-muted-foreground">
        Market data is for informational purposes only and is not investment advice.
      </p>
      <a
        href="https://www.tradingview.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-xs text-primary hover:underline"
      >
        Charts by TradingView
      </a>
    </section>
  );
};

export default TradingViewChart;
