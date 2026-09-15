export async function notifyOrder(order) {
  let phoneRaw = process.env.ADMIN_PHONE || process.env.WHATSAPP_NUMBER || '';
  let apikey = (process.env.CALLMEBOT_APIKEY || process.env.WHATSAPP_APIKEY || '').trim();
  let webhook = (process.env.WHATSAPP_WEBHOOK || '').trim();
  let tgToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  let tgChat = (process.env.TELEGRAM_CHAT_ID || '').trim();
  let ultraInstance = (process.env.ULTRAMSG_INSTANCE || '').trim();
  let ultraToken = (process.env.ULTRAMSG_TOKEN || '').trim();
  try {
    const { getDb } = await import('./db.js');
    const db = await getDb();
    if (db.whatsapp) {
      if (!phoneRaw && db.whatsapp.phone) phoneRaw = String(db.whatsapp.phone);
      if (!apikey && db.whatsapp.apikey) apikey = String(db.whatsapp.apikey).trim();
      if (!webhook && db.whatsapp.webhook) webhook = String(db.whatsapp.webhook).trim();
      if (!tgToken && db.whatsapp.tgToken) tgToken = String(db.whatsapp.tgToken).trim();
      if (!tgChat && db.whatsapp.tgChat) tgChat = String(db.whatsapp.tgChat).trim();
      if (!ultraInstance && db.whatsapp.ultraInstance) ultraInstance = String(db.whatsapp.ultraInstance).trim();
      if (!ultraToken && db.whatsapp.ultraToken) ultraToken = String(db.whatsapp.ultraToken).trim();
    }
  } catch {}
  if (!phoneRaw) phoneRaw = '212675993497';
  const phone = phoneRaw.replace(/\D/g, '');

  const text = `🛒 طلب جديد HIYORA!\n\nرقم: ${order.id}\nالعميل: ${order.customer.name}\nهاتف العميل: ${order.customer.phone}\nالمدينة: ${order.customer.city || '-'} \nالعنوان: ${order.customer.address || '-'} \nالإجمالي: ${order.total} DH\n\nالمنتجات:\n${order.items.map((i) => `• ${i.name} × ${i.qty} = ${i.price * i.qty} DH`).join('\n')}`;

  // UltraMsg WhatsApp (أسهل - امسح QR)
  if (ultraInstance && ultraToken) {
    try { const url=`https://api.ultramsg.com/${ultraInstance}/messages/chat`; const r=await fetch(url,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({token:ultraToken, to:phone, body:text})}); console.log('[NOTIFY] UltraMsg',r.status, (await r.text()).slice(0,200)); if(r.ok) return { ok:true, provider:'ultramsg' }; } catch(e){ console.error('[NOTIFY] UltraMsg failed',e.message); }
  }
  // 0) ntfy push (يعمل فورا بدون إعداد)
  try { const ntfyTopic = `hiyora-${phone.slice(-9)}`; await fetch(`https://ntfy.sh/${ntfyTopic}`, { method: 'POST', body: text, headers: { Title: 'طلب جديد HIYORA', Priority: 'high', Tags: 'shopping_cart' } }); console.log('[NOTIFY] ntfy', ntfyTopic); } catch(e){ console.error('[NOTIFY] ntfy failed',e.message); }
  // 0b) Telegram (أسهل من واتساب)
  if (tgToken && tgChat) {
    try { const url=`https://api.telegram.org/bot${tgToken}/sendMessage`; const r=await fetch(url,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({chat_id:tgChat, text})}); console.log('[NOTIFY] Telegram',r.status); if(r.ok) return { ok:true, provider:'telegram' }; } catch(e){ console.error('[NOTIFY] Telegram failed',e.message); }
  }
  // 1) CallMeBot (free WhatsApp) - needs apikey
  if (apikey && apikey !== 'YOUR_API_KEY_HERE' && apikey !== 'YOUR_KEY') {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${apikey}`;
    try {
      console.log('[NOTIFY] CallMeBot ->', phone);
      const res = await fetch(url);
      const body = await res.text();
      console.log('[NOTIFY] CallMeBot status', res.status, body.slice(0, 200));
      if (res.ok) return { ok: true, provider: 'callmebot', body };
    } catch (e) {
      console.error('[NOTIFY] CallMeBot failed', e.message);
    }
  }

  // 2) Generic webhook (any URL that accepts ?text or POST JSON)
  if (webhook && !webhook.includes('YOUR_API_KEY')) {
    try {
      console.log('[NOTIFY] Webhook ->', webhook);
      const sep = webhook.includes('?') ? '&' : '?';
      const url = `${webhook}${sep}text=${encodeURIComponent(text)}&phone=${phone}`;
      const res = await fetch(url);
      console.log('[NOTIFY] Webhook GET status', res.status);
      if (res.ok) return { ok: true, provider: 'webhook-get' };
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
}
