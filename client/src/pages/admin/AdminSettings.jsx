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

  async function enablePush(){
    try{
      if (!('Notification' in window)) { setMsg('❌ المتصفح لا يدعم الإشعارات'); return; }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setMsg('❌ رفضت الإذن'); return; }
      const reg = await navigator.serviceWorker.register('/sw.js');
      const r = await fetch('/api/push/vapidPublicKey'); const { publicKey } = await r.json();
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      await fetch('/api/push/subscribe', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(sub) });
      setMsg('✅ تم تفعيل الإشعارات! ستصلك حتى لو أغلقت الموقع');
      try{ await fetch('/api/push/test', { method:'POST', headers:{ Authorization:`Bearer ${localStorage.getItem('souk_token')}` }}); }catch{}
    }catch(e){ setMsg('❌ '+e.message); }
  }
  function urlBase64ToUint8Array(s){ const p='='.repeat((4-s.length%4)%4); const b=(s+p).replace(/-/g,'+').replace(/_/g,'/'); const r=atob(b); const o=new Uint8Array(r.length); for(let i=0;i<r.length;i++) o[i]=r.charCodeAt(i); return o; }

  async function test() {
    setMsg('⏳ جاري الإرسال...');
    const token = localStorage.getItem('souk_token');
    const res = await fetch('/api/notify/test-custom', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    setMsg(res.ok ? '✅ تم الإرسال (ntfy + Push + واتساب إن مضبوط)' : '❌ فشل');
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
      <div style={{ background: '#fff3cd', padding: 12, borderRadius: 8, margin: '12px 0', textAlign: 'center' }}>
        <button type="button" className="btn btn-primary" onClick={enablePush} style={{ fontSize: 18, padding: '12px 24px' }}>🔔 فعّل الإشعارات الآن (نقرة واحدة)</button>
        <div className="muted small" style={{ marginTop: 8 }}>يعمل على الهاتف والكمبيوتر حتى لو أغلقت الموقع - بدون واتساب</div>
      </div>
      <form onSubmit={save} className="form" style={{ maxWidth: 500 }}>
        <label>رقم واتساب/ntfy</label>
        <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="212675993497" />
        <label>CallMeBot apikey (واتساب - اختياري)</label>
        <input value={form.apikey} onChange={e => setForm({ ...form, apikey: e.target.value })} placeholder="123456" />
        <label>Telegram Bot Token (اختياري)</label>
        <input value={form.tgToken} onChange={e => setForm({ ...form, tgToken: e.target.value })} placeholder="123456:ABC..." />
        <label>Telegram Chat ID (اختياري)</label>
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
