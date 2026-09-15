import { useEffect, useState } from 'react';
import { useTranslation } from '../../context/TranslationContext.jsx';

export default function AdminSettings() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ phone: '', apikey: '', tgToken: '', tgChat: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('souk_token');
    fetch('/api/settings/whatsapp', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        setForm({ phone: d.phone || '212675993497', apikey: d.apikey || '', tgToken: d.tgToken || '', tgChat: d.tgChat || '' });
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  async function save(e) {
    e.preventDefault();
    setMsg('');
    const token = localStorage.getItem('souk_token');
    const res = await fetch('/api/settings/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    if (res.ok) setMsg('✅ تم الحفظ! جرّب زر التجريب.');
    else setMsg('❌ خطأ');
  }

  async function test() {
    setMsg('⏳ جاري الإرسال...');
    const token = localStorage.getItem('souk_token');
    const res = await fetch('/api/notify/test-custom', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    setMsg(res.ok ? '✅ تم إرسال رسالة تجريبية لواتساب!' : '❌ فشل - تأكد من apikey');
  }

  if (loading) return <div className="muted">{t('loading')}</div>;

  return (
    <div>
      <h1>⚙️ إعدادات الإشعارات</h1>
      <div style={{ background: '#e8f5e9', padding: 12, borderRadius: 8, margin: '12px 0' }}>
        <strong>✅ يعمل الآن بدون إعداد:</strong> حمّل <strong>ntfy</strong> من Play Store → اشترك في <code>hiyora-0675993497</code> → Push فوري
      </div>
      <div style={{ background: '#e3f2fd', padding: 12, borderRadius: 8, margin: '12px 0' }}>
        <strong>✈️ تيليجرام (أنصح به - أسهل من واتساب):</strong><br/>
        1- افتح تيليجرام → ابحث <strong>@BotFather</strong> → <code>/newbot</code> → انسخ الـ token<br/>
        2- ابحث عن بوتك → اضغط Start → افتح <code>https://api.telegram.org/botTOKEN/getUpdates</code> لمعرفة chat_id<br/>
        3- الصقهما هنا
      </div>
      <p className="muted small" style={{ background: '#fff3cd', padding: 12, borderRadius: 8, margin: '12px 0' }}>
        <strong>واتساب CallMeBot:</strong> جرب الرقم <strong>+34 644 53 78 58</strong> أو <strong>+34 621 37 21 09</strong> — أرسل <code>I allow callmebot to send me messages</code> — انسخ apikey
      </p>
      <form onSubmit={save} className="form" style={{ maxWidth: 500 }}>
        <label>رقم واتساب/ntfy</label>
        <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="212675993497" />
        <label>CallMeBot apikey (واتساب)</label>
        <input value={form.apikey} onChange={e => setForm({ ...form, apikey: e.target.value })} placeholder="123456" />
        <label>Telegram Bot Token</label>
        <input value={form.tgToken} onChange={e => setForm({ ...form, tgToken: e.target.value })} placeholder="123456:ABC..." />
        <label>Telegram Chat ID</label>
        <input value={form.tgChat} onChange={e => setForm({ ...form, tgChat: e.target.value })} placeholder="123456789" />
        {msg && <div className="alert" style={{ background: '#e8f5e9', padding: 10, borderRadius: 6 }}>{msg}</div>}
        <div className="row gap">
          <button className="btn btn-primary">حفظ</button>
          <button type="button" className="btn btn-outline" onClick={test}>📱 إرسال تجريب</button>
        </div>
      </form>
    </div>
  );
}
