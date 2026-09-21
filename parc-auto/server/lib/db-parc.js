import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, '..', 'data', 'db-parc.json');

// Générateur 50 véhicules réalistes
const MARQUES = [
  { marque: 'Dacia', modeles: ['Duster', 'Logan', 'Dokker'] },
  { marque: 'Renault', modeles: ['Clio 5', 'Express', 'Master'] },
  { marque: 'Peugeot', modeles: ['Partner', '301', 'Boxer'] },
  { marque: 'Toyota', modeles: ['Hilux', 'Corolla', 'Hiace'] },
  { marque: 'Hyundai', modeles: ['Accent', 'H-1'] },
  { marque: 'Ford', modeles: ['Transit', 'Focus'] },
  { marque: 'Volkswagen', modeles: ['Caddy', 'Passat'] },
];
const AFFECTATIONS = ['Direction Générale', 'Service Technique', 'Service Logistique', 'Service Général', 'Division RH', 'Division Financière', 'Parc Central', 'Délégation Régionale'];
const STATUTS = ['disponible', 'en_mission', 'en_panne'];
const LETTRES = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

function randMatricule(){
  const num = Math.floor(10000 + Math.random()*90000);
  const lettre = LETTRES[Math.floor(Math.random()*LETTRES.length)];
  const prov = Math.floor(1 + Math.random()*89);
  return `${num} | ${lettre} | ${prov}`;
}
function randChassis(){
  return 'VF1'+ Math.random().toString(36).toUpperCase().slice(2,10) + Math.floor(100000+Math.random()*900000);
}
function randDate(offsetDaysMin, offsetDaysMax){
  const now = new Date();
  const offset = Math.floor(offsetDaysMin + Math.random()*(offsetDaysMax-offsetDaysMin));
  const d = new Date(now.getTime() + offset*86400000);
  return d.toISOString().slice(0,10);
}

function generateVehicules(n=50){
  const list=[];
  for(let i=0;i<n;i++){
    const m = MARQUES[Math.floor(Math.random()*MARQUES.length)];
    const modele = m.modeles[Math.floor(Math.random()*m.modeles.length)];
    const annee = 2016 + Math.floor(Math.random()*9); // 2016-2024
    const km = Math.floor(15000 + Math.random()*120000);
    const statut = Math.random()<0.7 ? 'disponible' : Math.random()<0.5 ? 'en_mission' : 'en_panne';
    list.push({
      id: `V-${(1000+i).toString(36)}-${Math.random().toString(36).slice(2,4)}`,
      matricule: randMatricule(),
      marque: m.marque,
      modele,
      type: modele.includes('Master')||modele.includes('Transit')||modele.includes('Hiace')||modele.includes('Boxer') ? 'Utilitaire' : modele.includes('Hilux') ? 'Pick-up' : 'Berline/4x4',
      chassis: randChassis(),
      carburant: Math.random()<0.7 ? 'Diesel' : 'Essence',
      annee,
      dateMiseEnCirculation: `${annee}-${String(1+Math.floor(Math.random()*12)).padStart(2,'0')}-${String(1+Math.floor(Math.random()*28)).padStart(2,'0')}`,
      km,
      affectation: AFFECTATIONS[Math.floor(Math.random()*AFFECTATIONS.length)],
      statut,
      assurance: randDate(-60, 300),
      visiteTechnique: randDate(-30, 350),
      vignette: '2026-12-31',
      carteCarburant: `CC-${String(1000+i).padStart(4,'0')}`,
      dotationMensuelle: 400 + Math.floor(Math.random()*6)*100, // 400-900 DH
    });
  }
  return list;
}

const SEED_CHAUFFEURS = [
  { nom: 'Ahmed Bennani', matricule: 'CH-001', permis: 'B', tel: '0612345678', statut: 'disponible', affectation: 'Parc Central' },
  { nom: 'Youssef El Amrani', matricule: 'CH-002', permis: 'B/C', tel: '0623456789', statut: 'en_mission', affectation: 'Direction Générale' },
  { nom: 'Mustapha Fassi', matricule: 'CH-003', permis: 'B', tel: '0634567890', statut: 'disponible', affectation: 'Service Logistique' },
  { nom: 'Khalid Ouazzani', matricule: 'CH-004', permis: 'B', tel: '0645678901', statut: 'disponible', affectation: 'Service Technique' },
  { nom: 'Hassan Mouradi', matricule: 'CH-005', permis: 'C', tel: '0656789012', statut: 'disponible', affectation: 'Délégation Régionale' },
];

function makeSeed() {
  const vehicules = generateVehicules(50);
  const chauffeurs = SEED_CHAUFFEURS.map(c => ({ id: `CH-${Math.random().toString(36).slice(2,7)}`, ...c }));
  const missions = [
    { id: 'M-001', createdAt: new Date().toISOString(), vehiculeId: vehicules[0].id, chauffeur: chauffeurs[0].nom, demandeur: 'Service Technique', destination: 'Rabat - Ministère', dateDepart: '2026-09-22', dateRetour: '2026-09-22', kmDepart: vehicules[0].km, kmRetour: vehicules[0].km+400, motif: 'Réunion Direction', statut: 'validée_direction', bonMission: 'BM-2026-001' },
    { id: 'M-002', createdAt: new Date().toISOString(), vehiculeId: vehicules[1].id, chauffeur: chauffeurs[1].nom, demandeur: 'Division Financière', destination: 'Casablanca - Trésorerie', dateDepart: '2026-09-23', dateRetour: '', kmDepart: vehicules[1].km, kmRetour: '', motif: 'Dépôt dossier', statut: 'en_attente_chef_parc', bonMission: '' },
  ];
  const carburants = vehicules.slice(0,8).map((v,i)=> ({ id: `CB-${i}`, vehiculeId: v.id, carte: v.carteCarburant, date: randDate(-20,0), litres: 20+Math.floor(Math.random()*40), montant: 0, km: v.km - Math.floor(Math.random()*500), station: ['Afriquia','TotalEnergies','Shell','Petrom'][i%4], bon: `BC-${100+i}` }));
  carburants.forEach(c=> c.montant = Math.round(c.litres*13.5));
  const entretiens = [
    { id: 'E-1', vehiculeId: vehicules[2].id, date: randDate(-15,0), type: 'Vidange', km: vehicules[2].km-200, montant: 850, fournisseur: 'Garage Central Rabat', description: 'Vidange + filtres', pieces: 'Filtre huile, Filtre air' },
    { id: 'E-2', vehiculeId: vehicules[5].id, date: randDate(-10,0), type: 'Réparation', km: vehicules[5].km-100, montant: 3200, fournisseur: 'Auto Hall', description: 'Freins + plaquettes', pieces: 'Plaquettes, Disques' },
    { id: 'E-3', vehiculeId: vehicules[0].id, date: randDate(-30,0), type: 'Visite Technique', km: vehicules[0].km-500, montant: 350, fournisseur: 'Centre VT Hay Riad', description: 'Visite annuelle', pieces: '' },
  ];
  const infractions = [
    { id: 'PV-1', vehiculeId: vehicules[1].id, chauffeur: chauffeurs[1].nom, date: randDate(-10,0), type: 'Excès vitesse', lieu: 'Autoroute A1', montant: 600, points: 2, statut: 'payé', numeroPV: 'PV-2026-001' },
    { id: 'PV-2', vehiculeId: vehicules[7].id, chauffeur: chauffeurs[0].nom, date: randDate(-5,0), type: 'Stationnement', lieu: 'Rabat Agdal', montant: 200, points: 0, statut: 'en_attente', numeroPV: 'PV-2026-002' },
  ];
  return { vehicules, chauffeurs, missions, carburants, entretiens, infractions };
}

function loadSync() {
  if (!existsSync(DATA_FILE)) {
    mkdirSync(dirname(DATA_FILE), { recursive: true });
    const seed = makeSeed();
    saveSync(seed);
    return seed;
  }
  try { 
    const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
    // migrate if old seed with 4 vehicules
    if(!data.vehicules || data.vehicules.length < 10){
      const seed = makeSeed();
      saveSync(seed);
      return seed;
    }
    if(!data.infractions) data.infractions=[];
    if(!data.carburants) data.carburants=[];
    return data;
  } catch { const seed = makeSeed(); saveSync(seed); return seed; }
}
function saveSync(db) { mkdirSync(dirname(DATA_FILE), { recursive: true }); writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8'); }

export async function getDb() { return loadSync(); }
export async function updateDb(mutator) {
  const db = loadSync();
  const result = await mutator(db);
  saveSync(db);
  return result === undefined ? db : result;
}
export function resetTo50(){ const seed=makeSeed(); saveSync(seed); return seed; }
