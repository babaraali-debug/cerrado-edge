export default async function handler(req, res) {
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Ticker required' });

  try {
    const apiKey = process.env.FH_KEY;
    const to = Math.floor(Date.now() / 1000);
    const from = to - (1000 * 24 * 60 * 60);

    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(ticker)}&resolution=D&from=${from}&to=${to}&token=${apiKey}`;

    const response = await fetch(url, {
      headers: { 'X-Finnhub-Token': apiKey }
    });

    const data = await response.json();

    if (data.s === 'no_data' || !data.t || data.t.length === 0) {
      return res.status(404).json({ 
        error: 'No data found. Finnhub free tier may not support historical candles. Try upgrading.',
        raw: data
      });
    }

    const timeSeries = {};
    for (let i = 0; i < data.t.length; i++) {
      const date = new Date(data.t[i] * 1000).toISOString().split('T')[0];
      timeSeries[date] = {
        '1. open': data.o[i].toString(),
        '2. high': data.h[i].toString(),
        '3. low': data.l[i].toString(),
        '4. close': data.c[i].toString(),
        '5. volume': data.v[i].toString()
      };
    }

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).json({ 'Time Series (Daily)': timeSeries });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
