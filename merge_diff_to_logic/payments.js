const fs = require('fs');
const path = require('path');
const cfg = require('../config');

module.exports = function mergePayments(diffDir) {
  const pipeline = cfg.PIPELINES_MAP.PAYMENTS;  // из энама
  if (!pipeline) return [];

  const result = [];

  for (const root of pipeline.roots) {
    const filePath = path.join(diffDir, `${root}.json`);
    if (!fs.existsSync(filePath)) continue;

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const row of data) {
      row.__source = root;
      result.push(row);
    }
  }

  return result;
};