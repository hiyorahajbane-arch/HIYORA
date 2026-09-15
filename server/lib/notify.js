export async function notifyOrder(order) {
  const webhook = process.env.WHATSAPP_WEBHOOK || '';
  const phone = process.env.ADMIN_PHONE || '';
  if (!webhook || !phone) return;
  const text = `🛒 طلب جديد!\n\nرقم الطلب: ${order.id}\nالعميل: ${order.customer.name}\nالهاتف: ${order.customer.phone}\nالإجمالي: ${order.total} DH\nعدد المنتجات: ${order.items.length}\n\n${order.items.map((i) => `• ${i.name} × ${i.qty}`).join('\n')}`;
  try {
    const url = `${webhook}?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}`;
    await fetch(url, { timeout: 5000 });
  } catch {
    // Silently fail - notification is best effort
  }
}
