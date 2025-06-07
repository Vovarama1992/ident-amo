const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const axios = require('axios');

{/*const config = {
  server: 'localhost',
  database: 'PZ',
  user: 'readonly_user',
  password: 'U07cef1s9Tkc61rfYyA0BEZ43tdNyS',
  options: {
    instanceName: 'PZSQLSERVER',
    encrypt: false,
    trustServerCertificate: true
  }
};*/}
const config = {
  server: 'localhost',
  port: 50026,
  database: 'PZ',
  user: 'readonly_user',
  password: 'U07cef1s9Tkc61rfYyA0BEZ43tdNyS',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

const AMO_URL = 'https://dentmaximum.amocrm.ru';
const AMO_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImU5N2RmNzYyZTAzYTI1MDY5NWM5N2Y3N2RlZTFjNWJjMzdmMDA3YThiMGQ5MGNkNzFiYTQ3ODkzMmIwNmJkZGM5YzE1N2Y4ODRkZDQxODhlIn0.eyJhdWQiOiI4YmNiNDZhZi01NjVjLTQxMTMtOWUzMi04OTY1MWU1ZWExNDgiLCJqdGkiOiJlOTdkZjc2MmUwM2EyNTA2OTVjOTdmNzdkZWUxYzViYzM3ZjAwN2E4YjBkOTBjZDcxYmE0Nzg5MzJiMDZiZGRjOWMxNTdmODg0ZGQ0MTg4ZSIsImlhdCI6MTc0NjQ0MjM4NSwibmJmIjoxNzQ2NDQyMzg1LCJleHAiOjE3ODEyMjI0MDAsInN1YiI6IjkwMDU5NTgiLCJncmFudF90eXBlIjoiIiwiYWNjb3VudF9pZCI6MzA3MTc2NTgsImJhc2VfZG9tYWluIjoiYW1vY3JtLnJ1IiwidmVyc2lvbiI6Miwic2NvcGVzIjpbImNybSIsImZpbGVzIiwiZmlsZXNfZGVsZXRlIiwibm90aWZpY2F0aW9ucyIsInB1c2hfbm90aWZpY2F0aW9ucyJdLCJoYXNoX3V1aWQiOiIxZTY3OTU0NS05YzEzLTRjM2YtYmNlMi0zMGUxZDQ0YTQ3MmEiLCJhcGlfZG9tYWluIjoiYXBpLWIuYW1vY3JtLnJ1In0.p6Pl__JhXqznXz0UU0S4VOx4xI1uw903OKpxwyEjzle57agLxMIG_7U6OjZ-YQYbRfh7JqYcQGKzaRpuskDjlPIgxS9vBNU1cHHbzKPViAT3OlrIyyvHKrqpp9-vt63rn4MNbRDuZvTeYLr5KtlLQWuqZgHVNmL_qk_KJuI57VAegSuPYfBT5mPLcrK0lfj9Ms2XSTkFfI5Lu4-teLyQv25VWJrgN6SFDmPU6_kixxpb4ACC_jIffxU-Po6I40qdazkKje8oX8qzheQJ9CHfIi2p0aRS4s1KpuggLPnTy6MlUsdb3f2LVqO-ET2V30Ix-urkfbH6dsAomPA09Mm6og';

const TABLES = [
    'Appointments',
    'DeferredOrderDiscounts',
    'Diagnoses',
    'OnlineTickets',
    'Orders',
    'OrderServiceRelation',
    'Patients',
    'Patients_History',
    'PaymentsIn',
    'PaymentsOut',
    'Receptions',
    'ScheduledReceptions',
    'TreatmentPlanElements',
    'TreatmentPlans'
  ];
  
  const previousDir = path.join(__dirname, 'previous');
  const logsDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(previousDir)) fs.mkdirSync(previousDir);
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
  
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const logFile = path.join(logsDir, `${timestamp}.log`);
  
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  
  function loadPrevious(table) {
    const file = path.join(previousDir, `${table}.json`);
    if (!fs.existsSync(file)) return [];
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return [];
    }
  }
  
  function saveCurrent(table, data) {
    const file = path.join(previousDir, `${table}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  }
  
  function findNew(current, previous) {
    const prevIds = new Set(previous.map(r => r.ID));
    return current.filter(r => !prevIds.has(r.ID));
  }
  
  function logSuccess(table, row) {
    const amountField = Object.keys(row).find(k => /pay|sum|amount/i.test(k));
    const dateField = Object.keys(row).find(k => /date/i.test(k));
    const amount = amountField ? `${row[amountField]}₽` : 'неизвестная сумма';
    const date = dateField ? formatDate(row[dateField]) : 'неизвестная дата';
    const log = `[${new Date().toISOString()}] ✅ Таблица "${table}" — платеж на ${amount}, дата: ${date}, ID: ${row.ID}\n`;
    fs.appendFileSync(logFile, log, 'utf8');
  }
  
  async function sendToAmo(row, table) {
    const lead = {
      name: `Запись из ${table} (ID ${row.ID})`,
      price: Math.round(Number(row.Payment || row.Sum || row.Amount || 0)) || 0,
      pipeline_id: PIPELINE_ID,
      created_at: Math.floor(Date.now() / 1000)
    };
  
    try {
      await axios.post(`${AMO_URL}/api/v4/leads`, [lead], {
        headers: {
          'Authorization': `Bearer ${AMO_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      logSuccess(table, row);
    } catch (err) {
      const status = err?.response?.status || '???';
      const data = err?.response?.data || err.message;
      const log = `[${new Date().toISOString()}] ❌ Ошибка из ${table}, ID: ${row.ID}\n📛 HTTP ${status}\n🪵 ${JSON.stringify(data)}\n`;
      fs.appendFileSync(logFile, log, 'utf8');
    }
  }
  
  (async () => {
    console.log('🚀 full_bridger.js запущен...');
    try {
      const pool = await sql.connect(config);
      for (const table of TABLES) {
        console.log(`📦 Обрабатываем таблицу: ${table}`);
        try {
          const result = await pool.request().query(`SELECT TOP 1000 * FROM ${table}`);
          const current = result.recordset;
          const previous = loadPrevious(table);
          const fresh = findNew(current, previous);
          console.log(`🔍 Новых строк: ${fresh.length}`);
  
          for (const row of fresh) {
            await sendToAmo(row, table);
          }
  
          saveCurrent(table, current);
        } catch (err) {
          const error = `[${new Date().toISOString()}] ❌ Ошибка чтения таблицы ${table}:\n${err.message}\n`;
          fs.appendFileSync(logFile, error, 'utf8');
          console.error(error);
        }
      }
  
      await pool.close();
      console.log(`✅ Готово. Лог сохранён: ${path.basename(logFile)}`);
    } catch (err) {
      console.error('💥 Ошибка подключения к MSSQL:', err.message);
    }
  })();