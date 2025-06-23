const fs    = require('fs');
const path  = require('path');
const axios = require('axios');
const cfg   = require('../config');

const AMO_URL   = cfg.AMO.URL;
const AMO_TOKEN = cfg.AMO.TOKEN;

const matchesPath = path.join(__dirname, '..', 'matches.json');

// ---------- Persons → фамилия ---------------------------------------------
const personsFile = (cfg.ROOTS.find(r => r.name === 'Persons')?.name || 'Persons') + '.json';
const personsPath = path.join(__dirname, '..', cfg.PREVIOUS, personsFile);
const persons     = fs.existsSync(personsPath) ? JSON.parse(fs.readFileSync(personsPath, 'utf8')) : [];
const personsMap  = Object.fromEntries(persons.map(p => [p.ID, (p.Surname || '').toLowerCase()]));

// ---------- matches --------------------------------------------------------
const matches  = fs.existsSync(matchesPath) ? JSON.parse(fs.readFileSync(matchesPath, 'utf8')) : [];
const matchMap = Object.fromEntries(matches.map(m => [m.name.trim().toLowerCase(), m.contactId]));

const getContactInfo = idPatients => {
  const surname = personsMap[idPatients];
  return { surname, contactId: surname ? matchMap[surname] || null : null };
};

// ---------- helpers --------------------------------------------------------
const pad2 = n => String(n).padStart(2, '0');
const fmtDateTime = ts => {
  if (!ts) return '—';
  const [d, t] = ts.split(' ');
  if (!d || !t) return ts;
  const [Y, M, D] = d.split('-');
  const [H, m]    = t.split(':');
  return `${D}.${M}.${Y}, ${H}:${m}`;
};
const nowStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}_${pad2(d.getHours())}-${pad2(d.getMinutes())}`;
};
// ---------------------------------------------------------------------------

module.exports = async function (rows) {
  const attempts = [], sent = [], skipped = [];

  for (const rawRow of rows) {
    // унифицируем поля ID и сумма
    const row = { ...rawRow };
    if (row.ID === undefined && row.ID_Orders !== undefined) row.ID = row.ID_Orders;

    const { contactId, surname } = getContactInfo(row.ID_Patients);

    const sum = parseFloat(row.Payment ?? row.Amount ?? 0);
    const dateTimeRaw = row.DateTimePayment ?? row.DateTimeBill ?? '';
    const isoDate = dateTimeRaw.split(' ')[0];

    const human_comment =
      `💳 Поступил платёж: ${sum.toLocaleString('ru-RU')} ₽\n` +
      `Дата платежа: ${fmtDateTime(dateTimeRaw)}`;

    const payload = {
      type:   'payments',
      source: row.__source || 'unknown',
      id:     row.ID,
      surname,
      sum,
      date:   isoDate,
      human_comment
    };

    attempts.push(payload);

    if (!contactId) {
      skipped.push({ ...payload, reason: 'no_contactId' });
      continue;
    }

    const text = `${human_comment}\n\n🧾 Технические данные:\n${JSON.stringify(payload, null, 2)}`;

    try {
      await axios.post(
        `${AMO_URL}/api/v4/contacts/${contactId}/notes`,
        [{ note_type: 'common', params: { text } }],
        { headers: { Authorization: AMO_TOKEN, 'Content-Type': 'application/json' } }
      );

      sent.push(payload);
      console.log(`✅ Sent payment note to contact ${contactId}`);
    } catch (err) {
      skipped.push({ ...payload, reason: `HTTP ${err.response?.status || 0}` });
      console.error(`❌ Failed to send note: ${err.message}`);
    }

    if (sent.length >= 10) {
      console.log('🛑 10 записей отправлено, стоп.');
      break;
    }
  }

  // ---------- logging ------------------------------------------------------
  const logDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  fs.writeFileSync(
    path.join(logDir, `payments_${nowStr()}.json`),
    JSON.stringify({ attempts, sent, skipped }, null, 2),
    'utf8'
  );
  console.log('📝 Log saved');
};