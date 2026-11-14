import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { TrendingUp } from "lucide-react";

const markets = {
  Forex: [
    { label: "EUR / USD", value: "OANDA:EURUSD" },
    { label: "GBP / USD", value: "OANDA:GBPUSD" },
    { label: "USD / JPY", value: "OANDA:USDJPY" },
    { label: "AUD / USD", value: "OANDA:AUDUSD" },
    { label: "USD / CAD", value: "OANDA:USDCAD" },
    { label: "EUR / GBP", value: "OANDA:EURGBP" },
  ],
  Crypto: [
    { label: "Bitcoin / USDT", value: "BINANCE:BTCUSDT" },
    { label: "Ethereum / USDT", value: "BINANCE:ETHUSDT" },
    { label: "Solana / USDT", value: "BINANCE:SOLUSDT" },
    { label: "XRP / USDT", value: "BINANCE:XRPUSDT" },
    { label: "Cardano / USDT", value: "BINANCE:ADAUSDT" },
    { label: "Dogecoin / USDT", value: "BINANCE:DOGEUSDT" },
  ],
  Stocks: [
    { label: "Apple", value: "NASDAQ:AAPL" },
    { label: "Microsoft", value: "NASDAQ:MSFT" },
    { label: "NVIDIA", value: "NASDAQ:NVDA" },
    { label: "Amazon", value: "NASDAQ:AMZN" },
    { label: "Alphabet", value: "NASDAQ:GOOGL" },
    { label: "Tesla", value: "NASDAQ:TSLA" },
  ],
  Indices: [
    { label: "S&P 500", value: "SP:SPX" },
    { label: "Nasdaq 100", value: "NASDAQ:NDX" },
    { label: "Dow Jones", value: "DJ:DJI" },
    { label: "DAX", value: "XETR:DAX" },
    { label: "FTSE 100", value: "TVC:UKX" },
    { label: "Nikkei 225", value: "TVC:NI225" },
  ],
  Commodities: [
    { label: "Gold", value: "TVC:GOLD" },
    { label: "Silver", value: "TVC:SILVER" },
    { label: "Crude Oil", value: "TVC:USOIL" },
    { label: "Brent Oil", value: "TVC:UKOIL" },
    { label: "Natural Gas", value: "NYMEX:NG1!" },
    { label: "Copper", value: "COMEX:HG1!" },
  ],
  Futures: [
    { label: "S&P 500 E-mini", value: "CME_MINI:ES1!" },
    { label: "Nasdaq 100 E-mini", value: "CME_MINI:NQ1!" },
    { label: "Dow E-mini", value: "CBOT_MINI:YM1!" },
    { label: "Euro FX", value: "CME:6E1!" },
    { label: "Gold", value: "COMEX:GC1!" },
    { label: "Crude Oil", value: "NYMEX:CL1!" },
  ],
  Bonds: [
    { label: "U.S. 2-Year Yield", value: "TVC:US02Y" },
    { label: "U.S. 10-Year Yield", value: "TVC:US10Y" },
    { label: "U.S. 30-Year Yield", value: "TVC:US30Y" },
    { label: "Germany 10-Year Yield", value: "TVC:DE10Y" },
    { label: "U.K. 10-Year Yield", value: "TVC:GB10Y" },
    { label: "Japan 10-Year Yield", value: "TVC:JP10Y" },
  ],
  ETFs: [
    { label: "SPDR S&P 500 (SPY)", value: "AMEX:SPY" },
    { label: "Invesco QQQ", value: "NASDAQ:QQQ" },
    { label: "Vanguard Total Market (VTI)", value: "AMEX:VTI" },
    { label: "Gold ETF (GLD)", value: "AMEX:GLD" },
    { label: "Silver ETF (SLV)", value: "AMEX:SLV" },
    { label: "iShares Bitcoin Trust (IBIT)", value: "NASDAQ:IBIT" },
  ],
} as const;

type MarketType = keyof typeof markets;

const TradingViewChart = () => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [symbol, setSymbol] = useState("OANDA:EURUSD");
  const [marketType, setMarketType] = useState<MarketType>("Forex");

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
    <section className="rounded-xl border border-border bg-card p-5 shadow-card sm:p-6">
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
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <Label htmlFor="tradingview-market" className="sr-only">Market type</Label>
            <select
              id="tradingview-market"
              value={marketType}
              onChange={(event) => {
                const nextMarket = event.target.value as MarketType;
                setMarketType(nextMarket);
                setSymbol(markets[nextMarket][0].value);
              }}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {Object.keys(markets).map((market) => (
                <option key={market} value={market}>{market}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="tradingview-symbol" className="sr-only">Market instrument</Label>
            <select
              id="tradingview-symbol"
              value={symbol}
              onChange={(event) => setSymbol(event.target.value)}
              className="h-10 max-w-[220px] rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {markets[marketType].map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div
        ref={widgetRef}
        className="tradingview-widget-container h-[620px] overflow-hidden rounded-lg sm:h-[760px] xl:h-[820px]"
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
