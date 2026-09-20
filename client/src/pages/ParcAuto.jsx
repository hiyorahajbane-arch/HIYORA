import { useEffect, useState } from 'react';

const API = '/api/parc';

export default function ParcAuto() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [showVehiculeForm, setShowVehiculeForm] = useState(false);
  const [showMissionForm, setShowMissionForm] = useState(false);
  const [showCarburantForm, setShowCarburantForm] = useState(false);
  const [showEntretienForm, setShowEntretienForm] = useState(false);
  const [editingVehicule, setEditingVehicule] = useState(null);

  const fetchData = async () => {
    const r = await fetch(API);
    const j = await r.json();
    setData(j);
  };
  useEffect(() => { fetchData(); }, []);

  const addVehicule = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    if (editingVehicule) {
      await fetch(`${API}/vehicules/${editingVehicule.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch(`${API}/vehicules`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setShowVehiculeForm(false); setEditingVehicule(null); fetchData(); e.target.reset();
  };
  const addMission = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    await fetch(`${API}/missions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowMissionForm(false); fetchData();
  };
  const addCarburant = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    await fetch(`${API}/carburants`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowCarburantForm(false); fetchData();
  };
  const addEntretien = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    await fetch(`${API}/entretiens`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowEntretienForm(false); fetchData();
  };

  if (!data) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement du parc auto...</div>;

  const badge = (s) => {
    const styles = {
      disponible: { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
      en_mission: { background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' },
      en_panne: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
      validée: { background: '#dcfce7', color: '#166534' },
      en_cours: { background: '#fef9c3', color: '#854d0e' },
      terminée: { background: '#e5e7eb', color: '#374151' },
    };
    return <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, ...styles[s] }}>{s?.replace('_', ' ')}</span>;
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, fontFamily: 'system-ui, sans-serif', direction: 'ltr' }}>
      {/* Header */}
      <div style={{ background: '#0f172a', color: 'white', borderRadius: 16, padding: 24, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: 2, opacity: 0.7 }}>DIRECTION PUBLIQUE — ROYAUME DU MAROC</div>
          <h1 style={{ margin: '6px 0', fontSize: 26 }}>🚗 Gestion de Parc Automobile</h1>
          <div style={{ opacity: 0.8, fontSize: 13 }}>Système complet pour administration publique — Véhicules • Missions • Carburant • Maintenance</div>
        </div>
        <div style={{ background: 'white', color: '#0f172a', padding: '10px 16px', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{data.stats.totalVehicules}</div>
          <div style={{ fontSize: 11 }}>VÉHICULES</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          ['dashboard', '📊 Tableau de bord'],
          ['vehicules', `🚙 Véhicules (${data.vehicules.length})`],
          ['missions', `📋 Missions (${data.missions.length})`],
          ['carburant', '⛽ Carburant'],
          ['entretien', '🔧 Entretien'],
          ['chauffeurs', `👨‍✈️ Chauffeurs (${data.chauffeurs.length})`],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '8px 14px', borderRadius: 999, border: tab === id ? '2px solid #0f172a' : '1px solid #e5e7eb', background: tab === id ? '#0f172a' : 'white', color: tab === id ? 'white' : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Disponibles', value: data.stats.disponibles, color: '#16a34a', bg: '#f0fdf4' },
              { label: 'En mission', value: data.stats.enMission, color: '#2563eb', bg: '#eff6ff' },
              { label: 'En panne', value: data.stats.enPanne, color: '#dc2626', bg: '#fef2f2' },
              { label: 'Alertes VT/Assurance', value: data.stats.alertes, color: '#ea580c', bg: '#fff7ed' },
            ].map(c => (
              <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.color}20`, borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
                <div style={{ fontSize: 13, color: '#374151' }}>{c.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <h3 style={{ margin: '0 0 10px' }}>⚠️ Alertes à prévoir (Visite Technique / Assurance &lt; 30 jours)</h3>
            {data.vehicules.filter(v => (new Date(v.visiteTechnique) - new Date()) / 86400000 < 30).length === 0 ? <div style={{ color: '#16a34a' }}>Aucune alerte — parc à jour ✅</div> :
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f8fafc' }}><th style={th}>Véhicule</th><th style={th}>Matricule</th><th style={th}>Visite Technique</th><th style={th}>Assurance</th></tr></thead>
                <tbody>
                  {data.vehicules.filter(v => (new Date(v.visiteTechnique) - new Date()) / 86400000 < 45).map(v => (
                    <tr key={v.id}><td style={td}>{v.marque} {v.modele}</td><td style={td}>{v.matricule}</td><td style={td}>{v.visiteTechnique}</td><td style={td}>{v.assurance}</td></tr>
                  ))}
                </tbody>
              </table>
            }
          </div>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16 }}>
            <h3 style={{ margin: '0 0 10px' }}>Missions récentes</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f8fafc' }}><th style={th}>Date</th><th style={th}>Véhicule</th><th style={th}>Destination</th><th style={th}>Demandeur</th><th style={th}>Statut</th></tr></thead>
              <tbody>
                {data.missions.slice(0, 5).map(m => (
                  <tr key={m.id}><td style={td}>{m.dateDepart}</td><td style={td}>{m.vehicule?.matricule || '-'}</td><td style={td}>{m.destination}</td><td style={td}>{m.demandeur}</td><td style={td}>{badge(m.statut)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vehicules */}
      {tab === 'vehicules' && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Parc Véhicules</h3>
            <button onClick={() => { setEditingVehicule(null); setShowVehiculeForm(!showVehiculeForm); }} style={btnPrimary}>+ Ajouter véhicule</button>
          </div>

          {showVehiculeForm && (
            <form onSubmit={addVehicule} style={{ background: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              <input name="matricule" placeholder="Matricule * (ex: 12345 | أ | 1)" required defaultValue={editingVehicule?.matricule} style={inp} />
              <input name="marque" placeholder="Marque *" required defaultValue={editingVehicule?.marque} style={inp} />
              <input name="modele" placeholder="Modèle *" required defaultValue={editingVehicule?.modele} style={inp} />
              <input name="type" placeholder="Type (Berline, 4x4...)" defaultValue={editingVehicule?.type} style={inp} />
              <select name="carburant" defaultValue={editingVehicule?.carburant || 'Diesel'} style={inp}><option>Diesel</option><option>Essence</option><option>Hybride</option></select>
              <input name="annee" type="number" placeholder="Année" defaultValue={editingVehicule?.annee} style={inp} />
              <input name="km" type="number" placeholder="Kilométrage" defaultValue={editingVehicule?.km} style={inp} />
              <input name="affectation" placeholder="Affectation (Direction Générale...)" defaultValue={editingVehicule?.affectation} style={inp} />
              <select name="statut" defaultValue={editingVehicule?.statut || 'disponible'} style={inp}><option value="disponible">Disponible</option><option value="en_mission">En mission</option><option value="en_panne">En panne</option></select>
              <input name="assurance" type="date" defaultValue={editingVehicule?.assurance} style={inp} />
              <input name="visiteTechnique" type="date" defaultValue={editingVehicule?.visiteTechnique} style={inp} />
              <input name="vignette" type="date" defaultValue={editingVehicule?.vignette} style={inp} />
              <button type="submit" style={{ ...btnPrimary, gridColumn: '1/-1' }}>{editingVehicule ? 'Modifier' : 'Enregistrer'}</button>
            </form>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
              <thead><tr style={{ background: '#f8fafc' }}><th style={th}>Matricule</th><th style={th}>Véhicule</th><th style={th}>Affectation</th><th style={th}>KM</th><th style={th}>Statut</th><th style={th}>VT</th><th style={th}>Actions</th></tr></thead>
              <tbody>
                {data.vehicules.map(v => (
                  <tr key={v.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={td}><b>{v.matricule}</b></td>
                    <td style={td}>{v.marque} {v.modele} <span style={{ color: '#64748b' }}>({v.annee})</span></td>
                    <td style={td}>{v.affectation}</td>
                    <td style={td}>{Number(v.km).toLocaleString()} km</td>
                    <td style={td}>{badge(v.statut)}</td>
                    <td style={td}>{v.visiteTechnique}</td>
                    <td style={td}>
                      <button onClick={() => { setEditingVehicule(v); setShowVehiculeForm(true); }} style={btnSmall}>Modifier</button>
                      <button onClick={async () => { if (confirm('Supprimer ?')) { await fetch(`${API}/vehicules/${v.id}`, { method: 'DELETE' }); fetchData(); } }} style={{ ...btnSmall, color: '#dc2626', borderColor: '#fecaca' }}>Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Missions */}
      {tab === 'missions' && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Demandes & Missions</h3>
            <button onClick={() => setShowMissionForm(!showMissionForm)} style={btnPrimary}>+ Nouvelle mission</button>
          </div>
          {showMissionForm && (
            <form onSubmit={addMission} style={{ background: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              <select name="vehiculeId" required style={inp}><option value="">-- Véhicule --</option>{data.vehicules.filter(v => v.statut !== 'en_panne').map(v => <option key={v.id} value={v.id}>{v.matricule} - {v.marque} {v.modele}</option>)}</select>
              <input name="chauffeur" placeholder="Chauffeur" required style={inp} list="chauffeursList" />
              <datalist id="chauffeursList">{data.chauffeurs.map(c => <option key={c.id} value={c.nom} />)}</datalist>
              <input name="demandeur" placeholder="Service demandeur *" required style={inp} />
              <input name="destination" placeholder="Destination *" required style={inp} />
              <input name="dateDepart" type="date" required style={inp} />
              <input name="dateRetour" type="date" style={inp} />
              <input name="kmDepart" type="number" placeholder="KM départ" style={inp} />
              <input name="kmRetour" type="number" placeholder="KM retour" style={inp} />
              <input name="motif" placeholder="Motif" style={{ ...inp, gridColumn: '1/-1' }} />
              <select name="statut" style={inp}><option value="validée">Validée</option><option value="en_cours">En cours</option><option value="terminée">Terminée</option></select>
              <button type="submit" style={{ ...btnPrimary, gridColumn: '1/-1' }}>Créer mission / Bon de mission</button>
            </form>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#f8fafc' }}><th style={th}>Date</th><th style={th}>Véhicule</th><th style={th}>Chauffeur</th><th style={th}>Destination</th><th style={th}>KM</th><th style={th}>Statut</th></tr></thead>
            <tbody>
              {data.missions.map(m => (
                <tr key={m.id}><td style={td}>{m.dateDepart}</td><td style={td}>{m.vehicule?.matricule || '-'}<br /><span style={{ color: '#64748b', fontSize: 11 }}>{m.vehicule?.marque} {m.vehicule?.modele}</span></td><td style={td}>{m.chauffeur}</td><td style={td}>{m.destination}<br /><span style={{ color: '#64748b' }}>{m.motif}</span></td><td style={td}>{m.kmDepart} → {m.kmRetour || '...'}</td><td style={td}>{badge(m.statut)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Carburant */}
      {tab === 'carburant' && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>⛽ Suivi Carburant</h3>
            <button onClick={() => setShowCarburantForm(!showCarburantForm)} style={btnPrimary}>+ Ajouter plein</button>
          </div>
          {showCarburantForm && (
            <form onSubmit={addCarburant} style={{ background: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <select name="vehiculeId" required style={inp}><option value="">-- Véhicule --</option>{data.vehicules.map(v => <option key={v.id} value={v.id}>{v.matricule}</option>)}</select>
              <input name="date" type="date" required style={inp} />
              <input name="litres" type="number" placeholder="Litres" required style={inp} />
              <input name="montant" type="number" placeholder="Montant DH" required style={inp} />
              <input name="km" type="number" placeholder="KM compteur" required style={inp} />
              <input name="station" placeholder="Station" style={inp} />
              <button style={{ ...btnPrimary, gridColumn: '1/-1' }}>Enregistrer</button>
            </form>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#f8fafc' }}><th style={th}>Date</th><th style={th}>Véhicule</th><th style={th}>Litres</th><th style={th}>Montant</th><th style={th}>KM</th><th style={th}>Station</th></tr></thead>
            <tbody>{data.carburants.map(c => {
              const v = data.vehicules.find(v => v.id === c.vehiculeId);
              return <tr key={c.id}><td style={td}>{c.date}</td><td style={td}>{v?.matricule || '-'}</td><td style={td}>{c.litres} L</td><td style={td}>{c.montant} DH</td><td style={td}>{c.km}</td><td style={td}>{c.station}</td></tr>;
            })}</tbody>
          </table>
        </div>
      )}

      {/* Entretien */}
      {tab === 'entretien' && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>🔧 Maintenance & Réparations</h3>
            <button onClick={() => setShowEntretienForm(!showEntretienForm)} style={btnPrimary}>+ Nouvelle intervention</button>
          </div>
          {showEntretienForm && (
            <form onSubmit={addEntretien} style={{ background: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <select name="vehiculeId" required style={inp}><option value="">-- Véhicule --</option>{data.vehicules.map(v => <option key={v.id} value={v.id}>{v.matricule}</option>)}</select>
              <input name="date" type="date" required style={inp} />
              <select name="type" style={inp}><option>Vidange</option><option>Réparation</option><option>Visite Technique</option><option>Assurance</option><option>Pneus</option><option>Autre</option></select>
              <input name="km" type="number" placeholder="KM" style={inp} />
              <input name="montant" type="number" placeholder="Montant DH" style={inp} />
              <input name="fournisseur" placeholder="Fournisseur / Garage" style={inp} />
              <input name="description" placeholder="Description" style={{ ...inp, gridColumn: '1/-1' }} />
              <button style={{ ...btnPrimary, gridColumn: '1/-1' }}>Enregistrer</button>
            </form>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#f8fafc' }}><th style={th}>Date</th><th style={th}>Véhicule</th><th style={th}>Type</th><th style={th}>KM</th><th style={th}>Montant</th><th style={th}>Fournisseur</th></tr></thead>
            <tbody>{data.entretiens.map(e => {
              const v = data.vehicules.find(v => v.id === e.vehiculeId);
              return <tr key={e.id}><td style={td}>{e.date}</td><td style={td}>{v?.matricule || '-'}</td><td style={td}>{e.type}</td><td style={td}>{e.km}</td><td style={td}>{e.montant} DH</td><td style={td}>{e.fournisseur}</td></tr>;
            })}</tbody>
          </table>
        </div>
      )}

      {/* Chauffeurs */}
      {tab === 'chauffeurs' && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16 }}>
          <h3>Chauffeurs</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#f8fafc' }}><th style={th}>Nom</th><th style={th}>Matricule</th><th style={th}>Permis</th><th style={th}>Tél</th><th style={th}>Statut</th></tr></thead>
            <tbody>{data.chauffeurs.map(c => <tr key={c.id}><td style={td}>{c.nom}</td><td style={td}>{c.matricule}</td><td style={td}>{c.permis}</td><td style={td}>{c.tel}</td><td style={td}>{badge(c.statut)}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', borderRadius: 12, fontSize: 12, color: '#475569' }}>
        <b>💡 Pour une Direction Publique :</b> Ce système génère automatiquement les bons de mission, alertes VT/Assurance/Vignette, et le rapport mensuel (coût par véhicule + consommation). Hébergeable en intranet, avec rôles : Admin Parc / Chef Service / Directeur.
      </div>
    </div>
  );
}

const th = { padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e5e7eb', fontSize: 12 };
const td = { padding: '8px 10px', borderBottom: '1px solid #f1f5f9' };
const inp = { padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 };
const btnPrimary = { background: '#0f172a', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const btnSmall = { background: 'white', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, marginRight: 4 };
