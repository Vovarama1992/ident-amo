const fs = require('fs');
const path = require('path');
const cfg = require(path.resolve(__dirname, '..', 'config'));

const DIFF_DIR = path.join(__dirname, '..', cfg.DIFF);
const MERGED_DIR = path.join(__dirname, '..', cfg.MERGED || 'merged_diff');

if (fs.existsSync(MERGED_DIR)) fs.rmSync(MERGED_DIR, { recursive: true });
fs.mkdirSync(MERGED_DIR);

for (const { name: pipeline } of cfg.PIPELINES) {
  const mergeFnPath = path.join(__dirname, pipeline); // merge_diff_to_logic/payments.js и т.п.

  if (!fs.existsSync(mergeFnPath + '.js')) {
    console.warn(`⚠️  нет мерж-модуля для «${pipeline}» — пропущено`);
    continue;
  }

  const mergeFn = require(mergeFnPath);
  const data = mergeFn(DIFF_DIR);

  if (!data || data.length === 0) {
    console.log(`⚠️ ${pipeline}.json пуст — пропущен`);
    continue;
  }

  const outPath = path.join(MERGED_DIR, `${pipeline}.json`);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ ${pipeline}.json создан (${data.length} строк)`);
}

console.log('🧩 Склейка завершена.');
