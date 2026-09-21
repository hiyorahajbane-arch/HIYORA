import express from 'express';
import { getDb, updateDb, resetTo50 } from '../lib/db-parc.js';
const router = express.Router();

// Reset to 50
router.post('/reset50', async(req,res)=>{
  const seed = resetTo50();
  res.json({ ok:true, count: seed.vehicules.length });
});

router.get('/', async (req, res) => {
  const db = await getDb();
  const now = new Date();
  const missionsEnriched = db.missions.map(m => ({ ...m, vehicule: db.vehicules.find(v => v.id === m.vehiculeId) || null }));
  const carburantsEnriched = db.carburants.map(c=> ({...c, vehicule: db.vehicules.find(v=>v.id===c.vehiculeId)}));
  const entretiensEnriched = db.entretiens.map(e=> ({...e, vehicule: db.vehicules.find(v=>v.id===e.vehiculeId)}));
  
  // Alertes 30 jours
  const alertes = db.vehicules.filter(v=>{
    const vt = new Date(v.visiteTechnique);
    const ass = new Date(v.assurance);
    const diffVT = (vt - now)/86400000;
    const diffAss = (ass - now)/86400000;
    return diffVT < 30 || diffAss < 30;
  });
  
  // Coût par véhicule
  const coutParVehicule = db.vehicules.map(v=>{
    const carb = db.carburants.filter(c=>c.vehiculeId===v.id).reduce((s,c)=>s+c.montant,0);
    const ent = db.entretiens.filter(e=>e.vehiculeId===v.id).reduce((s,e)=>s+e.montant,0);
    const pv = (db.infractions||[]).filter(p=>p.vehiculeId===v.id).reduce((s,p)=>s+p.montant,0);
    const conso = db.carburants.filter(c=>c.vehiculeId===v.id);
    const totalLitres = conso.reduce((s,c)=>s+c.litres,0);
    const totalKmCarb = conso.length>=2 ? Math.max(...conso.map(c=>c.km)) - Math.min(...conso.map(c=>c.km)) : 0;
    const consoMoy = totalKmCarb>0 ? (totalLitres/totalKmCarb*100).toFixed(1) : '-';
    return { vehicule: v, total: carb+ent+pv, carburant: carb, entretien: ent, infractions: pv, consoMoy };
  }).sort((a,b)=>b.total-a.total);

  // Véhicules les plus en panne (nb entretiens réparation)
  const pannes = db.vehicules.map(v=>{
    const nb = db.entretiens.filter(e=>e.vehiculeId===v.id && e.type==='Réparation').length;
    return { vehicule: v, nb };
  }).filter(x=>x.nb>0).sort((a,b)=>b.nb-a.nb).slice(0,5);

  res.json({
    vehicules: db.vehicules,
    chauffeurs: db.chauffeurs,
    missions: missionsEnriched,
    carburants: carburantsEnriched,
    entretiens: entretiensEnriched,
    infractions: (db.infractions||[]).map(p=>({...p, vehicule: db.vehicules.find(v=>v.id===p.vehiculeId)})),
    alertes,
    coutParVehicule,
    pannes,
    stats: {
      totalVehicules: db.vehicules.length,
      disponibles: db.vehicules.filter(v => v.statut === 'disponible').length,
      enMission: db.vehicules.filter(v => v.statut === 'en_mission').length,
      enPanne: db.vehicules.filter(v => v.statut === 'en_panne').length,
      totalKm: db.vehicules.reduce((s,v)=>s+v.km,0),
      alertesCount: alertes.length,
      totalCarburant: db.carburants.reduce((s,c)=>s+c.montant,0),
      totalEntretien: db.entretiens.reduce((s,e)=>s+e.montant,0),
      totalPV: (db.infractions||[]).reduce((s,p)=>s+p.montant,0),
    }
  });
});

// Vehicules
router.post('/vehicules', async (req, res) => {
  const v = await updateDb(async (db) => { const o={id:`V-${Date.now().toString(36)}`,...req.body, km:Number(req.body.km)||0, dotationMensuelle: Number(req.body.dotationMensuelle)||500}; db.vehicules.unshift(o); return o; });
  res.json(v);
});
router.put('/vehicules/:id', async (req,res)=>{
  const u = await updateDb(async(db)=>{ const i=db.vehicules.findIndex(v=>v.id===req.params.id); if(i===-1) return null; db.vehicules[i]={...db.vehicules[i],...req.body}; if(req.body.km) db.vehicules[i].km=Number(req.body.km); return db.vehicules[i];});
  if(!u) return res.status(404).json({error:'Not found'}); res.json(u);
});
router.delete('/vehicules/:id', async(req,res)=>{ await updateDb(async(db)=>{ db.vehicules=db.vehicules.filter(v=>v.id!==req.params.id)}); res.json({ok:true})});

// Chauffeurs
router.post('/chauffeurs', async(req,res)=>{ const c=await updateDb(async(db)=>{ const o={id:`CH-${Date.now().toString(36)}`,...req.body}; db.chauffeurs.unshift(o); return o;}); res.json(c)});
router.put('/chauffeurs/:id', async(req,res)=>{
  const u=await updateDb(async(db)=>{ const i=db.chauffeurs.findIndex(c=>c.id===req.params.id); if(i===-1) return null; db.chauffeurs[i]={...db.chauffeurs[i],...req.body}; return db.chauffeurs[i]});
  if(!u) return res.status(404).json({error:'Not found'}); res.json(u);
});

// Missions workflow
router.post('/missions', async(req,res)=>{
  const m=await updateDb(async(db)=>{
    const o={id:`M-${Date.now().toString(36)}`,createdAt:new Date().toISOString(), bonMission: '', ...req.body, statut: req.body.statut||'en_attente_chef_parc'};
    if(o.statut==='validée_direction' && !o.bonMission) o.bonMission = `BM-${new Date().getFullYear()}-${String(db.missions.length+1).padStart(3,'0')}`;
    db.missions.unshift(o);
    if(o.statut==='validée_direction'){
      const v=db.vehicules.find(v=>v.id===o.vehiculeId); if(v) v.statut='en_mission';
    }
    return o;
  }); res.json(m)
});
router.put('/missions/:id', async(req,res)=>{
  const u=await updateDb(async(db)=>{
    const i=db.missions.findIndex(m=>m.id===req.params.id); if(i===-1) return null;
    const prev = db.missions[i].statut;
    db.missions[i]={...db.missions[i],...req.body};
    // générer bon si validation finale
    if(req.body.statut==='validée_direction' && !db.missions[i].bonMission){
      db.missions[i].bonMission = `BM-${new Date().getFullYear()}-${String(i+1).padStart(3,'0')}`;
    }
    // maj statut véhicule
    const v=db.vehicules.find(v=>v.id===db.missions[i].vehiculeId);
    if(v){
      if(req.body.statut==='validée_direction') v.statut='en_mission';
      if(req.body.statut==='terminée'){
        v.statut='disponible';
        if(req.body.kmRetour) v.km=Number(req.body.kmRetour);
      }
      if(req.body.statut==='refusée') v.statut='disponible';
    }
    return db.missions[i];
  }); if(!u) return res.status(404).json({error:'Not found'}); res.json(u);
});

// Carburant
router.post('/carburants', async(req,res)=>{
  const c=await updateDb(async(db)=>{
    const o={id:`CB-${Date.now().toString(36)}`,...req.body, litres:Number(req.body.litres), montant:Number(req.body.montant), km:Number(req.body.km)};
    if(!o.montant && o.litres) o.montant = Math.round(o.litres*13.5);
    db.carburants.unshift(o);
    const v=db.vehicules.find(v=>v.id===o.vehiculeId); if(v) v.km=Math.max(v.km,o.km);
    return o;
  }); res.json(c)
});
router.delete('/carburants/:id', async(req,res)=>{ await updateDb(async(db)=>{db.carburants=db.carburants.filter(c=>c.id!==req.params.id)}); res.json({ok:true})});

// Entretiens
router.post('/entretiens', async(req,res)=>{
  const e=await updateDb(async(db)=>{
    const o={id:`E-${Date.now().toString(36)}`,...req.body, montant:Number(req.body.montant), km:Number(req.body.km)};
    db.entretiens.unshift(o);
    if(o.type==='Réparation'){ const v=db.vehicules.find(v=>v.id===o.vehiculeId); if(v) v.statut='en_panne'; }
    return o;
  }); res.json(e)
});
router.put('/entretiens/:id', async(req,res)=>{
  const u=await updateDb(async(db)=>{ const i=db.entretiens.findIndex(e=>e.id===req.params.id); if(i===-1) return null; db.entretiens[i]={...db.entretiens[i],...req.body}; return db.entretiens[i]});
  if(!u) return res.status(404).json({error:'Not found'}); res.json(u);
});

// Infractions
router.post('/infractions', async(req,res)=>{
  const p=await updateDb(async(db)=>{
    if(!db.infractions) db.infractions=[];
    const o={id:`PV-${Date.now().toString(36)}`,...req.body, montant:Number(req.body.montant), points:Number(req.body.points)||0};
    db.infractions.unshift(o); return o;
  }); res.json(p)
});
router.put('/infractions/:id', async(req,res)=>{
  const u=await updateDb(async(db)=>{ const i=(db.infractions||[]).findIndex(p=>p.id===req.params.id); if(i===-1) return null; db.infractions[i]={...db.infractions[i],...req.body}; return db.infractions[i]});
  if(!u) return res.status(404).json({error:'Not found'}); res.json(u);
});
router.delete('/infractions/:id', async(req,res)=>{ await updateDb(async(db)=>{db.infractions=(db.infractions||[]).filter(p=>p.id!==req.params.id)}); res.json({ok:true})});

export default router;
