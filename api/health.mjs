// api/health.js
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ok',
    service: 'PRaudit AI — Marketing Intelligence API',
    agents: 10,
    model: 'claude-opus-4-5',
    timestamp: new Date().toISOString()
  });
}
