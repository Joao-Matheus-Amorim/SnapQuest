import fs from 'node:fs';

const required = [
  'index.html',
  'src/styles/app.css',
  'src/js/app.js',
  'src/js/core/balance.js',
  'src/js/core/battle.js',
  'src/js/core/cards.js',
  'src/js/core/fighters.js',
  'src/js/services/inventoryRepository.js',
  'src/js/services/localStore.js',
  'src/js/services/supabaseClient.js',
  'supabase/schema.sql',
];

let ok = true;

for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${file}`);
    ok = false;
  }
}

const html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('type="module"')) {
  console.error('index.html must load src/js/app.js as type="module".');
  ok = false;
}

const schema = fs.readFileSync('supabase/schema.sql', 'utf8');
if (!schema.includes('alter table public.snapquest_fighters enable row level security')) {
  console.error('schema.sql must enable RLS for fighters.');
  ok = false;
}

if (!schema.includes('auth.uid()')) {
  console.error('schema.sql must scope policies by auth.uid().');
  ok = false;
}

if (!ok) process.exit(1);

console.log('SnapQuest static checks passed.');
