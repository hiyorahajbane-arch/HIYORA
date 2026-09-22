import express from 'express';
import { getDb, updateDb } from '../lib/db-zawaj.js';
const router = express.Router();

router.get('/', async(req,res)=>{
  const db=await getDb();
  res.json({ profiles: db.profiles, demandes: db.demandes, stats: { total: db.profiles.length, hommes: db.profiles.filter(p=>p.genre==='homme').length, femmes: db.profiles.filter(p=>p.genre==='femme').length, verifie: db.profiles.filter(p=>p.verifie).length } });
});

router.get('/profiles', async(req,res)=>{
  const db=await getDb();
  let list=db.profiles;
  const { genre, ville, pays, ageMin, ageMax } = req.query;
  if(genre) list=list.filter(p=>p.genre===genre);
  if(ville) list=list.filter(p=>p.ville.toLowerCase().includes(ville.toLowerCase()));
  if(pays) list=list.filter(p=>p.pays.toLowerCase().includes(pays.toLowerCase()));
  if(ageMin) list=list.filter(p=>p.age>=Number(ageMin));
  if(ageMax) list=list.filter(p=>p.age<=Number(ageMax));
  res.json(list);
});

router.post('/profiles', async(req,res)=>{
  const p=await updateDb(async(db)=>{
    const o={ id:`U-${Date.now().toString(36)}`, createdAt:new Date().toISOString(), vues:0, likes:0, verifie:false, premium:false, ...req.body, age:Number(req.body.age) };
    if(o.age<18) throw new Error('18+ uniquement');
    db.profiles.unshift(o); return o;
  });
  res.json(p);
});

router.post('/demandes', async(req,res)=>{
  const d=await updateDb(async(db)=>{
    const o={ id:`D-${Date.now().toString(36)}`, date:new Date().toISOString(), statut:'en_attente', ...req.body };
    db.demandes.unshift(o); return o;
  });
  res.json(d);
});

router.put('/demandes/:id', async(req,res)=>{
  const u=await updateDb(async(db)=>{
    const i=db.demandes.findIndex(d=>d.id===req.params.id); if(i===-1) return null;
    db.demandes[i]={...db.demandes[i],...req.body}; return db.demandes[i];
  });
  if(!u) return res.status(404).json({error:'Not found'}); res.json(u);
});

router.get('/demandes', async(req,res)=>{
  const db=await getDb(); res.json(db.demandes);
});

router.post('/messages', async(req,res)=>{
  const m=await updateDb(async(db)=>{
    const o={ id:`M-${Date.now().toString(36)}`, date:new Date().toISOString(), ...req.body };
    db.messages.push(o); return o;
  });
  res.json(m);
});

router.get('/messages', async(req,res)=>{
  const db=await getDb();
  const { a, b } = req.query;
  let list=db.messages;
  if(a && b) list=list.filter(m=> (m.from===a && m.to===b) || (m.from===b && m.to===a));
  res.json(list);
});

router.post('/like/:id', async(req,res)=>{
  const u=await updateDb(async(db)=>{
    const p=db.profiles.find(x=>x.id===req.params.id); if(!p) return null; p.likes=(p.likes||0)+1; return p;
  });
  if(!u) return res.status(404).json({error:'Not found'}); res.json(u);
});

export default router;
