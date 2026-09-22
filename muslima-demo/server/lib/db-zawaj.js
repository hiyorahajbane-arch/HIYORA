import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, '..', 'data', 'db-zawaj.json');

const SEED_PROFILES = [
  { nom: 'Ahmed', age: 28, ville: 'Casablanca', pays: 'Maroc', genre: 'homme', situation: 'Célibataire', priere: 'Toujours', hijab: '-', barbe: 'Oui', etude: 'Master', travail: 'Ingénieur', description: 'Cherche femme pieuse pour mariage sérieux, respect et famille.', photo: 'https://i.pravatar.cc/300?img=12', premium: true, verifie: true },
  { nom: 'Fatima', age: 24, ville: 'Rabat', pays: 'Maroc', genre: 'femme', situation: 'Célibataire', priere: 'Toujours', hijab: 'Oui', barbe: '-', etude: 'Licence', travail: 'Enseignante', description: 'Femme voilée, cherche homme sérieux et pieux pour fonder foyer islamique.', photo: 'https://i.pravatar.cc/300?img=5', premium: false, verifie: true },
  { nom: 'Youssef', age: 32, ville: 'Paris', pays: 'France', genre: 'homme', situation: 'Divorcé', priere: 'Parfois', hijab: '-', barbe: 'Oui', etude: 'Bac+2', travail: 'Commerçant', description: 'Homme sérieux résidant en France, cherche femme marocaine pour mariage.', photo: 'https://i.pravatar.cc/300?img=15', premium: true, verifie: false },
  { nom: 'Khadija', age: 26, ville: 'Fès', pays: 'Maroc', genre: 'femme', situation: 'Célibataire', priere: 'Toujours', hijab: 'Oui', barbe: '-', etude: 'Master', travail: 'Infirmière', description: 'Cherche époux pieux, inchallah mariage dans le halal.', photo: 'https://i.pravatar.cc/300?img=9', premium: false, verifie: true },
  { nom: 'Omar', age: 30, ville: 'Tanger', pays: 'Maroc', genre: 'homme', situation: 'Célibataire', priere: 'Toujours', hijab: '-', barbe: 'Oui', etude: 'Doctorat', travail: 'Professeur', description: 'Pratiquant, cherche femme respectueuse pour vie stable.', photo: 'https://i.pravatar.cc/300?img=33', premium: false, verifie: true },
  { nom: 'Aicha', age: 22, ville: 'Marrakech', pays: 'Maroc', genre: 'femme', situation: 'Célibataire', priere: 'Toujours', hijab: 'Oui', barbe: '-', etude: 'Bac', travail: 'Étudiante', description: 'Jeune femme pieuse, cherche mariage halal avec homme sérieux.', photo: 'https://i.pravatar.cc/300?img=32', premium: false, verifie: false },
  { nom: 'Bilal', age: 29, ville: 'Bruxelles', pays: 'Belgique', genre: 'homme', situation: 'Célibataire', priere: 'Toujours', hijab: '-', barbe: 'Oui', etude: 'Ingénieur', travail: 'Informatique', description: 'Résidant Belgique, cherche femme pour mariage et hijra.', photo: 'https://i.pravatar.cc/300?img=18', premium: true, verifie: true },
  { nom: 'Sara', age: 27, ville: 'Agadir', pays: 'Maroc', genre: 'femme', situation: 'Célibataire', priere: 'Parfois', hijab: 'Non', barbe: '-', etude: 'Licence', travail: 'Comptable', description: 'Cherche homme sérieux pour mariage, famille avant tout.', photo: 'https://i.pravatar.cc/300?img=26', premium: true, verifie: true },
];

function makeSeed(){
  const profiles = SEED_PROFILES.map((p,i)=> ({ id: `U-${100+i}`, createdAt: new Date().toISOString(), vues: Math.floor(20+Math.random()*200), likes: Math.floor(Math.random()*15), ...p }));
  return {
    profiles,
    demandes: [
      { id: 'D-1', from: profiles[0].id, to: profiles[1].id, message: 'Salam, votre profil m\'intéresse pour mariage sérieux. Acceptez-vous d\'échanger?', date: new Date().toISOString(), statut: 'en_attente' },
    ],
    messages: [
      { id: 'M-1', from: profiles[0].id, to: profiles[1].id, text: 'Salam aleykoum, j\'aimerais vous connaître dans le cadre du halal.', date: new Date().toISOString() },
    ],
    users: [
      { id: 'U-ADMIN', email: 'admin@hajbane.com', password: 'admin123', profileId: profiles[0].id, role: 'admin' }
    ]
  };
}
function loadSync(){
  if(!existsSync(DATA_FILE)){ mkdirSync(dirname(DATA_FILE),{recursive:true}); const s=makeSeed(); writeFileSync(DATA_FILE, JSON.stringify(s,null,2)); return s; }
  try{ return JSON.parse(readFileSync(DATA_FILE,'utf8')); }catch{ const s=makeSeed(); writeFileSync(DATA_FILE, JSON.stringify(s,null,2)); return s; }
}
function saveSync(db){ mkdirSync(dirname(DATA_FILE),{recursive:true}); writeFileSync(DATA_FILE, JSON.stringify(db,null,2)); }
export async function getDb(){ return loadSync(); }
export async function updateDb(fn){ const db=loadSync(); const r=await fn(db); saveSync(db); return r===undefined?db:r; }
