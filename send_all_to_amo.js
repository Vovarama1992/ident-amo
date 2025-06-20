const fs = require('fs');
const path = require('path');
const cfg = require('./config');

const HANDLERS_DIR = path.join(__dirname, 'handlers');
const MERGED_DIR = path.join(__dirname, 'merged_diff');

(async () => {
  for (const pipeline of cfg.PIPELINES) {
    const handlerFile = pipeline.name + '.js';
    const handlerPath = path.join(HANDLERS_DIR, handlerFile);
    const dataFile = path.join(MERGED_DIR, pipeline.name + '.json');

    if (!fs.existsSync(handlerPath)) {
      console.warn(`⚠️ Хендлер не найден: ${handlerFile} — пропускаем`);
      continue;
    }

    if (!fs.existsSync(dataFile)) {
      console.warn(`⚠️ Данные не найдены: ${pipeline.name}.json — пропускаем`);
      continue;
    }

    const rows = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

    try {
      const handler = require(handlerPath);
      if (typeof handler !== 'function') {
        console.error(`❌ Хендлер ${handlerFile} не функция`);
        continue;
      }

      console.log(`🚀 Запуск хендлера ${handlerFile} с ${rows.length} строками`);
      await handler(rows);
    } catch (err) {
      console.error(`❌ Ошибка в хендлере ${handlerFile}: ${err.message}`);
    }
  }

  console.log('✅ Все хендлеры запущены');
})();