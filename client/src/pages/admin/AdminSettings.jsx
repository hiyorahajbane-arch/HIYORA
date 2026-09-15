import { useEffect, useState } from 'react';
import { useTranslation } from '../../context/TranslationContext.jsx';

export default function AdminSettings() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ phone: '', apikey: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('souk_token');
    fetch('/api/settings/whatsapp', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        setForm({ phone: d.phone || '212675993497', apikey: d.apikey || '' });
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
        <strong>✅ إشعار فوري بدون واتساب (يعمل الآن):</strong><br/>
        حمّل تطبيق <strong>ntfy</strong> من Play Store → اشترك في موضوع <code>hiyora-0675993497</code> → ستصلك الإشعارات فورا حتى لو لم تفتح الموقع.
      </div>
      <p className="muted small" style={{ background: '#fff3cd', padding: 12, borderRadius: 8, margin: '12px 0' }}>
        <strong>واتساب (اختياري):</strong> الرقم القديم توقف. الرقم الحالي <strong>+34 644 53 78 58</strong><br/>
        1- احفظ <strong>+34 644 53 78 58</strong> في هاتفك<br/>
        2- أرسل له: <code>I allow callmebot to send me messages</code><br/>
        3- انسخ <code>apikey=XXXXXX</code> والصقه هنا — أو اتركه فارغا وسيعمل ntfy فقط
      </p>
      <form onSubmit={save} className="form" style={{ maxWidth: 500 }}>
        <label>رقم واتساب الإدارة</label>
        <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="212675993497" />
        <label>CallMeBot apikey</label>
        <input value={form.apikey} onChange={e => setForm({ ...form, apikey: e.target.value })} placeholder="123456" />
        {msg && <div className="alert" style={{ background: '#e8f5e9', padding: 10, borderRadius: 6 }}>{msg}</div>}
        <div className="row gap">
          <button className="btn btn-primary">حفظ</button>
          <button type="button" className="btn btn-outline" onClick={test}>📱 إرسال تجريب</button>
        </div>
      </form>
    </div>
  );
}
