const fs    = require('fs');
const path  = require('path');
const axios = require('axios');
const cfg   = require('../config');

const AMO_URL   = cfg.AMO.URL;
const AMO_TOKEN = cfg.AMO.TOKEN;

const matchesPath = path.join(__dirname, '..', 'matches.json');

// ---------- Persons → ФИО --------------------------------------------------
const personsFile = (cfg.ROOTS.find(r => r.name === 'Persons')?.name || 'Persons') + '.json';
const personsPath = path.join(__dirname, '..', cfg.PREVIOUS, personsFile);
const persons     = fs.existsSync(personsPath) ? JSON.parse(fs.readFileSync(personsPath, 'utf8')) : [];

const personsInfo = Object.fromEntries(
  persons.map(p => [
    p.ID,
    {
      surname:    (p.Surname || '').trim(),
      name:       (p.Name || '').trim(),
      patronymic: (p.Patronymic || '').trim()
    }
  ])
);

// ---------- matches --------------------------------------------------------
const matches  = fs.existsSync(matchesPath) ? JSON.parse(fs.readFileSync(matchesPath, 'utf8')) : [];
const matchMap = Object.fromEntries(matches.map(m => [m.name.trim().toLowerCase(), m.contactId]));

function getContactInfo(idPatients) {
  const p = personsInfo[idPatients];
  if (!p) return { contactId: null, full_name: null, surname: null };
  const full_name = [p.surname, p.name, p.patronymic].filter(Boolean).join(' ');
  const contactId = matchMap[p.surname.toLowerCase()] || null;
  return { contactId, full_name, surname: p.surname };
}

// ---------- helpers --------------------------------------------------------
const pad2 = n => String(n).padStart(2, '0');
const fmtDate = ts => ts ? ts.split(' ')[0] : '';
const nowStr  = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}_${pad2(d.getHours())}-${pad2(d.getMinutes())}`;
};
// ---------------------------------------------------------------------------

module.exports = async function (rows) {
  const attempts = [], sent = [], skipped = [];

  for (const row of rows) {
    const { contactId, full_name, surname } = getContactInfo(row.ID_Patients);

    const date     = fmtDate(row.ReceptionStarted);
    const appeared = row.PatientAppeared === '1' || row.PatientAppeared === true;

    const human_comment =
      `📍 Визит пациента ${full_name || '(неизвестно)'}\n` +
      `Дата: ${date || '—'}\n` +
      `Явился: ${appeared ? 'да' : 'нет'}`;

    const payload = {
      type: 'visits',
      id: row.ID,
      surname,
      full_name,
      date,
      appeared,
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
      console.log(`✅ Sent visit note to contact ${contactId}`);
    } catch (err) {
      skipped.push({ ...payload, reason: `HTTP ${err.response?.status || 0}` });
      console.error(`❌ Failed to send note: ${err.message}`);
    }

    if (sent.length >= 10) {
      console.log('🛑 10 записей отправлено, стоп.');
      break;
    }
  }

  const logDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

  fs.writeFileSync(
    path.join(logDir, `visits_${nowStr()}.json`),
    JSON.stringify({ attempts, sent, skipped }, null, 2),
    'utf8'
  );
  console.log('📝 Log saved');
};