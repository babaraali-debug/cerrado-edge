export default async function handler(req, res) {
  const { ticker } = req.query;
  
  if (!ticker) {
    return res.status(400).json({ error: 'Ticker required' });
  }

  try {
    const apiKey = process.env.AV_KEY;
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=full&apikey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Error Message']) {
      return res.status(404).json({ error: 'Ticker not found' });
    }
    if (data['Note'] || data['Information']) {
      return res.status(429).json({ error: 'API limit reached. Wait 1 minute.' });
    }

    // Cache for 24 hours — only calls Alpha Vantage once per ticker per day
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
