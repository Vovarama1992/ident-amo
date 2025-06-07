const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

const TABLE = 'PaymentsIn';
const tsvPath = path.join(__dirname, 'output.tsv');
const previousPath = path.join(__dirname, 'previous', `${TABLE}.json`);
const diffPath = path.join(__dirname, 'diff.json');
if (!fs.existsSync(path.dirname(previousPath))) fs.mkdirSync(path.dirname(previousPath));

function parseTSV(tsv) {
  const [headerLine, ...lines] = tsv.trim().split('\n');
  const headers = headerLine.split('\t');
  return lines.map(line => {
    const cols = line.split('\t');
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = cols[i]?.trim());
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

// 👇 ключевое отличие — читаем как бинарный и декодируем
const rawBuffer = fs.readFileSync(tsvPath);
const decoded = iconv.decode(rawBuffer, 'win1251');
const current = parseTSV(decoded);

const previous = loadJSON(previousPath);
const fresh = findNewRows(current, previous);

console.log(`📄 Всего строк: ${current.length}`);
console.log(`🆕 Новых строк: ${fresh.length}`);

saveJSON(previousPath, current);

if (fresh.length > 0) {
  saveJSON(diffPath, fresh);
  console.log('💾 Сохранено в diff.json');
} else {
  if (fs.existsSync(diffPath)) fs.unlinkSync(diffPath);
  console.log('📭 Новых строк нет, diff.json удалён');
}