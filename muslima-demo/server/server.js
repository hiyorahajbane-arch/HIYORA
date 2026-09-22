import express from 'express';
import cors from 'cors';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import zawajRouter from './routes/zawaj.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const app=express();
const PORT=process.env.PORT||3003;
app.use(cors());
app.use(express.json());
app.get('/api', (req,res)=>res.json({ name:'Zawaj HAJBANE - Muslima-like', version:'1.0.0 - HAJBANE', halal:true }));
app.get('/api/health', (req,res)=>res.json({ok:true}));
app.use('/api/zawaj', zawajRouter);
const CLIENT_DIST=join(__dirname,'..','client','dist');
app.use(express.static(CLIENT_DIST));
app.get('*',(req,res)=>{
  try{ res.sendFile(join(CLIENT_DIST,'index.html')); }catch{ res.json({ok:true}); }
});
app.listen(PORT, ()=> console.log(`[ZAWAJ-HAJBANE] ✅ http://localhost:${PORT} • API http://localhost:${PORT}/api/zawaj`));
