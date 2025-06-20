const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const cfg = require('./config');

const inputDir     = path.join(__dirname, cfg.OUTPUT);
const previousDir  = path.join(__dirname, cfg.PREVIOUS);
const diffDir      = path.join(__dirname, cfg.DIFF);

if (!fs.existsSync(previousDir)) fs.mkdirSync(previousDir);
if (!fs.existsSync(diffDir)) fs.mkdirSync(diffDir);

function parseTSV(tsv) {
  const lines = tsv.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split('\t').map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split('\t');
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i]?.trim();
    });
    return obj;
  });
}

function loadJSON(path, fallback = []) {
  try {
    return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
}

function findNewRows(current, previous) {
  const prevIds = new Set(previous.map(r => r.ID));
  return current.filter(r => !prevIds.has(r.ID));
}

let totalNew = 0;
const tables = cfg.ROOTS.map(r => r.name);

for (const table of tables) {
  const filePath = path.join(inputDir, `${table}.tsv`);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Пропущено: ${table}.tsv не найден`);
    continue;
  }

  const rawBuffer = fs.readFileSync(filePath);
  const decoded = iconv.decode(rawBuffer, 'win1251');
  const current = parseTSV(decoded);
  const previous = loadJSON(path.join(previousDir, `${table}.json`));
  const fresh = findNewRows(current, previous);

  console.log(`📄 ${table}: всего ${current.length}, новых ${fresh.length}`);

  saveJSON(path.join(previousDir, `${table}.json`), current);
  const diffPath = path.join(diffDir, `${table}.json`);

  if (fresh.length > 0) {
    const limited = fresh.slice(0, 10);
    saveJSON(diffPath, limited);
    totalNew += limited.length;
    console.log(`✂️  ${table}: сохранено только ${limited.length} строк (из ${fresh.length})`);
  }
}

console.log(`✅ Обработка завершена. Всего новых строк: ${totalNew}`);