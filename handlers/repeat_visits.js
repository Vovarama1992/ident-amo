const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cfg = require('../config');

const AMO_URL = cfg.AMO.URL;
const AMO_TOKEN = cfg.AMO.TOKEN;

const matchesPath = path.join(__dirname, '..', 'matches.json');
const matches = fs.existsSync(matchesPath) ? JSON.parse(fs.readFileSync(matchesPath, 'utf8')) : [];
const matchMap = Object.fromEntries(matches.map(m => [m.name.trim().toLowerCase(), m.contactId]));

function nowStr() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
}

module.exports = async function (input) {
  const data = input?.[0];
  if (!data || !Array.isArray(data.receptions) || !Array.isArray(data.patients)) {
    console.error('❌ Неверный формат данных для repeat_visits');
    return;
  }

  const patientMap = Object.fromEntries(
    data.patients.map(p => [p.ID_Persons, (p.ParentSNP || '').split(' ')[0].toLowerCase()])
  );

  const attempts = [];
  const sent = [];
  const skipped = [];

  for (const row of data.receptions) {
    const surname = patientMap[row.ID_Patients];
    const contactId = surname ? matchMap[surname] : null;

    const rawDates = {
      ReceptionStarted: row.ReceptionStarted,
      PlanStart: row.PlanStart,
      ReceptionAdded: row.ReceptionAdded,
      ReceptionEnded: row.ReceptionEnded,
      CheckIssued: row.CheckIssued
    };

    const dates = {};
    for (const [key, value] of Object.entries(rawDates)) {
      dates[key] = value ? value.split(' ')[0] : null;
    }

    const payload = {
      type: 'repeat_visits',
      id: row.ID,
      dates
    };

    attempts.push(payload);

    if (!contactId) {
      skipped.push({ ...payload, reason: 'no_contactId' });
      continue;
    }

    try {
      await axios.post(`${AMO_URL}/api/v4/contacts/${contactId}/notes`, [
        {
          note_type: 'common',
          params: { text: JSON.stringify(payload, null, 2) }
        }
      ], {
        headers: {
          Authorization: AMO_TOKEN,
          'Content-Type': 'application/json'
        }
      });

      sent.push(payload);
      console.log(`✅ Sent repeat_visit note to contact ${contactId}`);
    } catch (err) {
      skipped.push({ ...payload, reason: `HTTP ${err.response?.status || 0}` });
      console.error(`❌ Failed to send note: ${err.message}`);
    }

    if (sent.length >= 10) {
      console.log('🛑 10 записей отправлено, стоп.');
      break;
    }
  }

  const log = { attempts, sent, skipped };
  const logName = `repeat_visits_${nowStr()}.json`;
  const logDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  const logPath = path.join(logDir, logName);
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2), 'utf8');
  console.log(`📝 Log saved to logs/${logName}`);
};