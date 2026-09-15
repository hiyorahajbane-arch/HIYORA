export async function notifyOrder(order) {
  const phoneRaw = process.env.ADMIN_PHONE || process.env.WHATSAPP_NUMBER || '212675993497';
  const phone = phoneRaw.replace(/\D/g, '');
  const apikey = (process.env.CALLMEBOT_APIKEY || process.env.WHATSAPP_APIKEY || '').trim();
  const webhook = (process.env.WHATSAPP_WEBHOOK || '').trim();

  const text = `🛒 طلب جديد HIYORA!\n\nرقم: ${order.id}\nالعميل: ${order.customer.name}\nهاتف العميل: ${order.customer.phone}\nالمدينة: ${order.customer.city || '-'} \nالعنوان: ${order.customer.address || '-'} \nالإجمالي: ${order.total} DH\n\nالمنتجات:\n${order.items.map((i) => `• ${i.name} × ${i.qty} = ${i.price * i.qty} DH`).join('\n')}`;

  // 1) CallMeBot (free WhatsApp) - needs apikey
  if (apikey && apikey !== 'YOUR_API_KEY_HERE' && apikey !== 'YOUR_KEY') {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${apikey}`;
    try {
      console.log('[NOTIFY] CallMeBot ->', phone);
      const res = await fetch(url);
      const body = await res.text();
      console.log('[NOTIFY] CallMeBot status', res.status, body.slice(0, 200));
      return { ok: res.ok, provider: 'callmebot', body };
    } catch (e) {
      console.error('[NOTIFY] CallMeBot failed', e.message);
    }
  }

  // 2) Generic webhook (any URL that accepts ?text or POST JSON)
  if (webhook && !webhook.includes('YOUR_API_KEY')) {
    try {
      console.log('[NOTIFY] Webhook ->', webhook);
      // try GET with ?text first
      const sep = webhook.includes('?') ? '&' : '?';
      const url = `${webhook}${sep}text=${encodeURIComponent(text)}&phone=${phone}`;
      const res = await fetch(url);
      console.log('[NOTIFY] Webhook GET status', res.status);
      if (res.ok) return { ok: true, provider: 'webhook-get' };
      // fallback POST JSON
      const res2 = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, text, order })
      });
      console.log('[NOTIFY] Webhook POST status', res2.status);
      return { ok: res2.ok, provider: 'webhook-post' };
    } catch (e) {
      console.error('[NOTIFY] Webhook failed', e.message);
    }
  }

  console.log('[NOTIFY] No WhatsApp config - set CALLMEBOT_APIKEY or WHATSAPP_WEBHOOK on Vercel. Order:', order.id);
  return { ok: false, reason: 'no-config' };
}
