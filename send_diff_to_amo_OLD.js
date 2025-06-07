const fs = require('fs');
const path = require('path');
const axios = require('axios');

const AMO_URL = 'https://dentmaximum.amocrm.ru';
const AMO_TOKEN = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImU5N2RmNzYyZTAzYTI1MDY5NWM5N2Y3N2RlZTFjNWJjMzdmMDA3YThiMGQ5MGNkNzFiYTQ3ODkzMmIwNmJkZGM5YzE1N2Y4ODRkZDQxODhlIn0.eyJhdWQiOiI4YmNiNDZhZi01NjVjLTQxMTMtOWUzMi04OTY1MWU1ZWExNDgiLCJqdGkiOiJlOTdkZjc2MmUwM2EyNTA2OTVjOTdmNzdkZWUxYzViYzM3ZjAwN2E4YjBkOTBjZDcxYmE0Nzg5MzJiMDZiZGRjOWMxNTdmODg0ZGQ0MTg4ZSIsImlhdCI6MTc0NjQ0MjM4NSwibmJmIjoxNzQ2NDQyMzg1LCJleHAiOjE3ODEyMjI0MDAsInN1YiI6IjkwMDU5NTgiLCJncmFudF90eXBlIjoiIiwiYWNjb3VudF9pZCI6MzA3MTc2NTgsImJhc2VfZG9tYWluIjoiYW1vY3JtLnJ1IiwidmVyc2lvbiI6Miwic2NvcGVzIjpbImNybSIsImZpbGVzIiwiZmlsZXNfZGVsZXRlIiwibm90aWZpY2F0aW9ucyIsInB1c2hfbm90aWZpY2F0aW9ucyJdLCJoYXNoX3V1aWQiOiIxZTY3OTU0NS05YzEzLTRjM2YtYmNlMi0zMGUxZDQ0YTQ3MmEiLCJhcGlfZG9tYWluIjoiYXBpLWIuYW1vY3JtLnJ1In0.p6Pl__JhXqznXz0UU0S4VOx4xI1uw903OKpxwyEjzle57agLxMIG_7U6OjZ-YQYbRfh7JqYcQGKzaRpuskDjlPIgxS9vBNU1cHHbzKPViAT3OlrIyyvHKrqpp9-vt63rn4MNbRDuZvTeYLr5KtlLQWuqZgHVNmL_qk_KJuI57VAegSuPYfBT5mPLcrK0lfj9Ms2XSTkFfI5Lu4-teLyQv25VWJrgN6SFDmPU6_kixxpb4ACC_jIffxU-Po6I40qdazkKje8oX8qzheQJ9CHfIi2p0aRS4s1KpuggLPnTy6MlUsdb3f2LVqO-ET2V30Ix-urkfbH6dsAomPA09Mm6og';

const diffPath = path.join(__dirname, 'diff.json');
const matchesPath = path.join(__dirname, 'matches_short.json');
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const now = new Date();
const pad = n => String(n).padStart(2, '0');
const logTimestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
const logFile = path.join(logDir, `send_${logTimestamp}.json`);
const archiveDiffPath = path.join(__dirname, `diff_${logTimestamp}.json`);
const noPhoneFile = path.join(logDir, `no_phone_${logTimestamp}.txt`);
const noPhoneUsers = [];

const matches = fs.existsSync(matchesPath) ? JSON.parse(fs.readFileSync(matchesPath, 'utf8')) : [];

function getContactIdFromMatches(surname) {
  const target = surname?.trim().toLowerCase();
  if (!target) return null;
  const match = matches.find(m => m.name.trim().toLowerCase() === target);
  return match?.contactId || null;
}

function format(dateStr) {
  const d = new Date(dateStr);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function createNote(contactId, text) {
  await axios.post(`${AMO_URL}/api/v4/contacts/${contactId}/notes`, [
    {
      note_type: 'common',
      params: { text }
    }
  ], {
    headers: {
      Authorization: AMO_TOKEN,
      'Content-Type': 'application/json'
    }
  });
}

(async () => {
  if (!fs.existsSync(diffPath)) {
    console.log('📭 Нет diff.json — нечего отправлять.');
    return;
  }

  const rows = JSON.parse(fs.readFileSync(diffPath, 'utf8'));
  console.log(`📦 Найдено записей в diff.json: ${rows.length}`);

  let successCount = 0;
  const logs = [];

  for (const row of rows) {
    const fio = `${row.SurName || '???'} ${row.Name || '???'}`.trim();
    const phone = row.Phone || row.PhoneOutInt || '—';
    const date = format(row.DateTimePayment);
    const logEntry = {
      id: row.ID,
      fio,
      phone,
      date,
      contactMatched: false,
      contactId: null,
      noteSent: false,
      error: null,
    };

    const contactId = getContactIdFromMatches(row.SurName);
    if (!contactId) {
      noPhoneUsers.push(fio);
      logEntry.error = 'Контакт не найден по фамилии';
      logs.push(logEntry);
      continue;
    }

    logEntry.contactMatched = true;
    logEntry.contactId = contactId;

    const text = `Платёж #${row.ID}\nСумма: ${row.Payment}₽\nДата: ${date}`;
    try {
      await createNote(contactId, text);
      logEntry.noteSent = true;
      console.log(`✅ Платёж #${row.ID} → контакт ${contactId}`);
      successCount++;
    } catch (err) {
      logEntry.error = `Ошибка создания заметки: ${err.message}`;
      console.error(`❌ Ошибка при заметке ID ${row.ID}: ${err.message}`);
    }

    logs.push(logEntry);

    if (successCount >= 10) {
      console.log('🛑 Отправлено 10 успешных записей. Остановлено.');
      break;
    }
  }

  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf8');
  console.log(`📝 Сохранён лог в формате JSON: ${path.basename(logFile)}`);

  if (noPhoneUsers.length > 0) {
    const unique = [...new Set(noPhoneUsers)];
    const text = unique.map(name => `— ${name}`).join('\n');
    fs.writeFileSync(noPhoneFile, text, 'utf8');
    console.log(`📄 Сохранён список пользователей без контакта: ${path.basename(noPhoneFile)}`);
  }

  fs.renameSync(diffPath, archiveDiffPath);
  console.log(`🗃️ Архивирован: ${path.basename(archiveDiffPath)}`);
})();