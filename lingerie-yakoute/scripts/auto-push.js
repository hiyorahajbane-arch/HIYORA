import { watch } from 'node:fs';
import { execFile } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GIT = 'C:\\Program Files\\Git\\cmd\\git.exe';

let timer = null;
let pushing = false;

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(push, 10000);
}

function run(args) {
  return new Promise((resolve) => {
    execFile(GIT, args, { cwd: ROOT }, (err, stdout, stderr) => {
      resolve({ err, stdout: (stdout || '').trim(), stderr: (stderr || '').trim() });
    });
  });
}

async function push() {
  if (pushing) return;
  pushing = true;
  try {
    const status = await run(['status', '--porcelain']);
    if (!status.stdout) {
      console.log('[SYNC] لا يوجد تغيير.');
      return;
    }
    await run(['add', '-A']);
    const commit = await run(['commit', '-m', 'تحديث تلقائي من المحرر']);
    if (commit.err && !commit.stdout.includes('تحديث تلقائي')) {
      console.log('[SYNC] تعذر الحفظ:', commit.stderr.split('\n')[0]);
      return;
    }
    console.log('[SYNC] جارِ الدفع للموقع...');
    const res = await run(['push']);
    if (res.err && !res.stderr.includes('main -> main') && !res.stdout.includes('main -> main')) {
      console.log('[SYNC] تعذر الدفع:', res.stderr.split('\n')[0]);
      return;
    }
    console.log('[SYNC] تم! التعديل طالع للموقع، Vercel كيعاود النشر أوطو ✅');
  } finally {
    pushing = false;
  }
}

const WATCH_DIRS = ['client/src', 'server', 'api', 'scripts'];
for (const dir of WATCH_DIRS) {
  try {
    watch(join(ROOT, dir), { recursive: true }, (event, filename) => {
      if (!filename) return;
      if (filename.includes('node_modules') || filename.includes('.git')) return;
      console.log(`[SYNC] تعديل: ${dir}/${filename} — الدفع بعد 10 ثواني...`);
      schedule();
    });
    console.log(`[SYNC] مراقبة ${dir}`);
  } catch (e) {
    console.log(`[SYNC] تخطي ${dir}: غير موجود`);
  }
}
console.log('[SYNC] خليه محلول — أي تعديل غادي يطلع للموقع أوطوماتيك ✅');
setInterval(() => {}, 60000);
