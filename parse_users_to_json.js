const fs = require('fs');
const path = require('path');

const tsvPath = path.join(__dirname, 'users_without_phone.tsv');
const jsonPath = path.join(__dirname, 'users_without_phone.json');

const raw = fs.readFileSync(tsvPath, 'utf8');
const [headerLine, ...lines] = raw.trim().split('\n');
const headers = headerLine.trim().split('\t');

const data = lines.map(line => {
  const cols = line.split('\t');
  const obj = {};
  headers.forEach((h, i) => {
    obj[h.trim()] = cols[i]?.trim();
  });
  return obj;
});

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`✅ Сохранено ${data.length} пользователей без телефона в users_without_phone.json`);