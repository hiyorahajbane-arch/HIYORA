import express from 'express';
import { getDb, updateDb } from '../lib/db.js';

const router = express.Router();

// Seed parc data
const SEED_VEHICULES = [
  { matricule: '12345 | أ | 1', marque: 'Dacia', modele: 'Duster', type: '4x4', carburant: 'Diesel', annee: 2021, km: 45200, affectation: 'Direction Générale', statut: 'disponible', assurance: '2026-08-15', visiteTechnique: '2026-09-10', vignette: '2026-12-31' },
  { matricule: '67890 | ب | 5', marque: 'Renault', modele: 'Clio 5', type: 'Berline', carburant: 'Essence', annee: 2022, km: 32100, affectation: 'Service Technique', statut: 'en_mission', assurance: '2026-07-01', visiteTechnique: '2026-11-20', vignette: '2026-12-31' },
  { matricule: '11223 | أ | 12', marque: 'Toyota', modele: 'Hilux', type: 'Pick-up', carburant: 'Diesel', annee: 2020, km: 78500, affectation: 'Service Logistique', statut: 'en_panne', assurance: '2026-06-15', visiteTechnique: '2026-07-30', vignette: '2026-12-31' },
  { matricule: '44556 | ج | 3', marque: 'Peugeot', modele: 'Partner', type: 'Utilitaire', carburant: 'Diesel', annee: 2019, km: 95000, affectation: 'Service Général', statut: 'disponible', assurance: '2026-05-20', visiteTechnique: '2026-10-05', vignette: '2026-12-31' },
];

const SEED_CHAUFFEURS = [
  { nom: 'Ahmed Bennani', matricule: 'CH-001', permis: 'B', tel: '0612345678', statut: 'disponible' },
  { nom: 'Youssef El Amrani', matricule: 'CH-002', permis: 'B/C', tel: '0623456789', statut: 'en_mission' },
  { nom: 'Mustapha Fassi', matricule: 'CH-003', permis: 'B', tel: '0634567890', statut: 'disponible' },
];

const SEED_MISSIONS = [
  { vehiculeId: null, chauffeur: 'Ahmed Bennani', demandeur: 'Service Technique', destination: 'Rabat - Ministère', dateDepart: '2026-09-22', dateRetour: '2026-09-22', kmDepart: 45200, kmRetour: 45600, motif: 'Réunion Direction', statut: 'validée' },
  { vehiculeId: null, chauffeur: 'Youssef El Amrani', demandeur: 'Direction Générale', destination: 'Casablanca - Wilaya', dateDepart: '2026-09-21', dateRetour: '2026-09-21', kmDepart: 32100, kmRetour: 32450, motif: 'Transport courrier urgent', statut: 'en_cours' },
];

function ensureParc(db) {
  if (!db.parc) db.parc = {};
  if (!db.parc.vehicules || db.parc.vehicules.length === 0) {
    db.parc.vehicules = SEED_VEHICULES.map(v => ({ id: `V-${Math.random().toString(36).slice(2,7)}`, ...v }));
  }
  if (!db.parc.chauffeurs || db.parc.chauffeurs.length === 0) {
    db.parc.chauffeurs = SEED_CHAUFFEURS.map(c => ({ id: `CH-${Math.random().toString(36).slice(2,7)}`, ...c }));
  }
  if (!db.parc.missions || db.parc.missions.length === 0) {
    // link vehiculeId
    const missions = SEED_MISSIONS.map(m => ({ id: `M-${Math.random().toString(36).slice(2,7)}`, createdAt: new Date().toISOString(), ...m }));
    if (db.parc.vehicules.length >= 2) {
      missions[0].vehiculeId = db.parc.vehicules[0].id;
      missions[1].vehiculeId = db.parc.vehicules[1].id;
    }
    db.parc.missions = missions;
  }
  if (!db.parc.carburants) db.parc.carburants = [
    { id: 'CB-1', vehiculeId: db.parc.vehicules[0]?.id, date: '2026-09-15', litres: 40, montant: 520, km: 45000, station: 'Afriquia' },
    { id: 'CB-2', vehiculeId: db.parc.vehicules[1]?.id, date: '2026-09-18', litres: 30, montant: 390, km: 32000, station: 'TotalEnergies' },
  ];
  if (!db.parc.entretiens) db.parc.entretiens = [
    { id: 'E-1', vehiculeId: db.parc.vehicules[2]?.id, date: '2026-09-10', type: 'Vidange', km: 78000, montant: 850, fournisseur: 'Garage Central', description: 'Vidange + filtres' },
    { id: 'E-2', vehiculeId: db.parc.vehicules[0]?.id, date: '2026-08-20', type: 'Visite Technique', km: 44000, montant: 350, fournisseur: 'Centre VT Hay Riad', description: 'Visite annuelle' },
  ];
  return db.parc;
}

// Helper to get parc
router.get('/', async (req, res) => {
  const db = await getDb();
  const parc = ensureParc(db);
  // enrich missions with vehicule matricule
  const missionsEnriched = parc.missions.map(m => ({
    ...m,
    vehicule: parc.vehicules.find(v => v.id === m.vehiculeId) || null
  }));
  res.json({
    vehicules: parc.vehicules,
    chauffeurs: parc.chauffeurs,
    missions: missionsEnriched,
    carburants: parc.carburants,
    entretiens: parc.entretiens,
    stats: {
      totalVehicules: parc.vehicules.length,
      disponibles: parc.vehicules.filter(v => v.statut === 'disponible').length,
      enMission: parc.vehicules.filter(v => v.statut === 'en_mission').length,
      enPanne: parc.vehicules.filter(v => v.statut === 'en_panne').length,
      totalKm: parc.vehicules.reduce((s,v)=>s+v.km,0),
      alertes: parc.vehicules.filter(v => {
        const vt = new Date(v.visiteTechnique);
        const diff = (vt - new Date()) / (1000*60*60*24);
        return diff < 30;
      }).length
    }
  });
});

// Vehicules CRUD
router.post('/vehicules', async (req, res) => {
  const data = req.body;
  const vehicule = await updateDb(async (db) => {
    ensureParc(db);
    const v = { id: `V-${Date.now().toString(36)}`, ...data, km: Number(data.km)||0 };
    db.parc.vehicules.unshift(v);
    return v;
  });
  res.json(vehicule);
});

router.put('/vehicules/:id', async (req, res) => {
  const updated = await updateDb(async (db) => {
    ensureParc(db);
    const idx = db.parc.vehicules.findIndex(v => v.id === req.params.id);
    if (idx === -1) return null;
    db.parc.vehicules[idx] = { ...db.parc.vehicules[idx], ...req.body };
    return db.parc.vehicules[idx];
  });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

router.delete('/vehicules/:id', async (req, res) => {
  await updateDb(async (db) => {
    ensureParc(db);
    db.parc.vehicules = db.parc.vehicules.filter(v => v.id !== req.params.id);
  });
  res.json({ ok: true });
});

// Chauffeurs
router.post('/chauffeurs', async (req, res) => {
  const c = await updateDb(async (db) => {
    ensureParc(db);
    const obj = { id: `CH-${Date.now().toString(36)}`, ...req.body };
    db.parc.chauffeurs.unshift(obj);
    return obj;
  });
  res.json(c);
});

// Missions
router.post('/missions', async (req, res) => {
  const m = await updateDb(async (db) => {
    ensureParc(db);
    const obj = { id: `M-${Date.now().toString(36)}`, createdAt: new Date().toISOString(), ...req.body };
    db.parc.missions.unshift(obj);
    // update vehicule statut
    const v = db.parc.vehicules.find(v => v.id === obj.vehiculeId);
    if (v) v.statut = 'en_mission';
    return obj;
  });
  res.json(m);
});

router.put('/missions/:id', async (req, res) => {
  const updated = await updateDb(async (db) => {
    ensureParc(db);
    const idx = db.parc.missions.findIndex(m => m.id === req.params.id);
    if (idx === -1) return null;
    db.parc.missions[idx] = { ...db.parc.missions[idx], ...req.body };
    // if mission terminée, libérer véhicule
    if (req.body.statut === 'terminée' || req.body.statut === 'validée') {
      const v = db.parc.vehicules.find(v => v.id === db.parc.missions[idx].vehiculeId);
      if (v && req.body.kmRetour) v.km = Number(req.body.kmRetour);
    }
    return db.parc.missions[idx];
  });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

// Carburant
router.post('/carburants', async (req, res) => {
  const c = await updateDb(async (db) => {
    ensureParc(db);
    const obj = { id: `CB-${Date.now().toString(36)}`, ...req.body, litres: Number(req.body.litres), montant: Number(req.body.montant), km: Number(req.body.km) };
    db.parc.carburants.unshift(obj);
    const v = db.parc.vehicules.find(v => v.id === obj.vehiculeId);
    if (v) v.km = obj.km;
    return obj;
  });
  res.json(c);
});

// Entretiens
router.post('/entretiens', async (req, res) => {
  const e = await updateDb(async (db) => {
    ensureParc(db);
    const obj = { id: `E-${Date.now().toString(36)}`, ...req.body, montant: Number(req.body.montant), km: Number(req.body.km) };
    db.parc.entretiens.unshift(obj);
    return obj;
  });
  res.json(e);
});

export default router;
