export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.url === '/api/health') {
    return res.json({ ok: true, test: 'minimal works', url: req.url });
  }
  if (req.url.startsWith('/api/products')) {
    return res.json([{ id: 'test', name: 'هاتف تجريبي', price: 999 }]);
  }
  if (req.url.startsWith('/api')) {
    return res.json({ name: 'سوق - واجهة برمجية للمتجر', version: '1.0.0', url: req.url });
  }
  res.status(404).json({ error: 'not found' });
}
