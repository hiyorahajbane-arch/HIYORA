export async function notifyOrder(order) {
  const webhook = process.env.WHATSAPP_WEBHOOK || 'https://api.callmebot.com/whatsapp.php?phone=+212675993497&apikey=YOUR_KEY';
  const phone = process.env.ADMIN_PHONE || '+212675993497';
  const text = `🛒 طلب جديد!

رقم الطلب: ${order.id}
العميل: ${order.customer.name}
الهاتف: ${order.customer.phone}
الإجمالي: ${order.total} DH
عدد المنتجات: ${order.items.length}

${order.items.map((i) => `• ${i.name} × ${i.qty}`).join('\n')}`;
  try {
    const url = `${webhook}?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}`;
    const res = await fetch(url, { timeout: 5000 });
    console.log('[NOTIFY] Sent to:', phone, 'Status:', res.status);
  } catch (err) {
    console.error('[NOTIFY] Failed:', err.message);
  }
}
