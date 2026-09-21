export default async (request) => {
  try {
    const url = new URL(request.url);
    const symbol = (url.searchParams.get("symbol") || "").trim().toUpperCase();

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: "symbol is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const apiKey = Netlify.env.get("TWELVE_DATA_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key is not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const endpoint =
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`;

    const response = await fetch(endpoint);
    const data = await response.json();

    if (!response.ok || data.status === "error") {
      return new Response(
        JSON.stringify({
          error: data.message || "Twelve Data request failed"
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({
        symbol: data.symbol,
        name: data.name,
        exchange: data.exchange,
        currency: data.currency,
        price: Number(data.close),
        previousClose: Number(data.previous_close),
        change: Number(data.change),
        percentChange: Number(data.percent_change),
        volume: Number(data.volume),
        datetime: data.datetime
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
