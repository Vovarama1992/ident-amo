const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const cfg = require('./config');

const OUT_DIR = path.join(__dirname, cfg.OUTPUT || 'output');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

for (const root of cfg.ROOTS) {
  const { name, sql } = root;
  const outFile = path.join(OUT_DIR, `${name}.tsv`);

  const cmd = [
    'sqlcmd',
    `-S "${cfg.SERVER}"`,
    `-U ${cfg.USER}`,
    `-P ${cfg.PASSWORD}`,
    `-d ${cfg.DATABASE}`,
    `-Q "${sql.replace(/"/g, '""')}"`,
    '-s "\\t"',
    '-W',
    `-o "${outFile}"`
  ].join(' ');

  console.log(`📤 ${name} → ${outFile}`);
  try {
    execSync(cmd, { stdio: 'inherit', encoding: 'utf8' });
  } catch (e) {
    console.error(`❌ ${name}: ${e.message}`);
  }
}

console.log('✅ Экспорт завершён');