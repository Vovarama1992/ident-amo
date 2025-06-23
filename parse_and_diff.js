const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const cfg = require('./config');

const inputDir    = path.join(__dirname, cfg.OUTPUT);
const previousDir = path.join(__dirname, cfg.PREVIOUS);
const diffDir     = path.join(__dirname, cfg.DIFF);

if (!fs.existsSync(previousDir)) fs.mkdirSync(previousDir, { recursive: true });
if (!fs.existsSync(diffDir)) fs.mkdirSync(diffDir, { recursive: true });

function parseTSV(tsv) {
  const lines = tsv.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  // Разделяем по обратному слешу '\'
  const headers = lines[0].split('\\').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\\');
    if (cols.length !== headers.length) {
      console.warn(`⚠️ Строка ${i + 1} пропущена — несовпадение колонок (${cols.length} vs ${headers.length})`);
      continue;
    }
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = cols[j]?.trim() ?? null;
    }
    data.push(obj);
  }
  return data;
}

function loadJSON(filePath, fallback = []) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch {
    // можно логировать ошибку, если надо
  }
  return fallback;
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function getIdField(tableName) {
  switch (tableName.toLowerCase()) {
    case 'patients': return 'ID_Persons';
    case 'orderpaymentsjournal': return 'ID_Orders';
    case 'persons': return 'ID_Persons';  // добавь сюда
    default: return 'ID';
  }
}

function findNewRows(current, previous, idField) {
  const prevIds = new Set(previous.map(r => r[idField]));
  return current.filter(r => r[idField] && !prevIds.has(r[idField]));
}

let totalNew = 0;
for (const { name: tableRaw } of cfg.ROOTS) {
  const table = tableRaw.toLowerCase();
  const filePath = path.join(inputDir, `${tableRaw}.tsv`);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Файл ${tableRaw}.tsv не найден — пропуск`);
    continue;
  }

  const rawBuffer = fs.readFileSync(filePath);
  const decoded = iconv.decode(rawBuffer, 'win1251');
  const current = parseTSV(decoded);

  const prevPath = path.join(previousDir, `${tableRaw}.json`);
  const previous = loadJSON(prevPath);

  const idField = getIdField(table);
  console.log(`📄 ${tableRaw}: всего ${current.length}, предыдущих ${previous.length}, idField=${idField}`);

  const fresh = findNewRows(current, previous, idField);
  console.log(`🆕 ${tableRaw}: новых строк ${fresh.length}`);

  saveJSON(prevPath, current);

  if (fresh.length > 0) {
    const limited = fresh.slice(0, 10);
    saveJSON(path.join(diffDir, `${tableRaw}.json`), limited);
    totalNew += limited.length;
    console.log(`✂️ ${tableRaw}: сохранено в дифф ${limited.length} из ${fresh.length}`);
  }
}

console.log(`✅ Готово. Всего новых строк во всех таблицах: ${totalNew}`);