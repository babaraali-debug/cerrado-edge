export default async function handler(req, res) {
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Ticker required' });

  try {
    const end = Math.floor(Date.now() / 1000);
    const start = end - (1000 * 24 * 60 * 60);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&period1=${start}&period2=${end}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    const chart = data?.chart?.result?.[0];
    
    if (!chart) return res.status(404).json({ error: 'Ticker not found' });
    
    const timestamps = chart.timestamp;
    const ohlcv = chart.indicators.quote[0];
    
    const timeSeries = {};
    for (let i = 0; i < timestamps.length; i++) {
      const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
      timeSeries[date] = {
        '1. open': (ohlcv.open[i] || 0).toString(),
        '2. high': (ohlcv.high[i] || 0).toString(),
        '3. low': (ohlcv.low[i] || 0).toString(),
        '4. close': (ohlcv.close[i] || 0).toString(),
        '5. volume': (ohlcv.volume[i] || 0).toString()
      };
    }

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).json({ 'Time Series (Daily)': timeSeries });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
