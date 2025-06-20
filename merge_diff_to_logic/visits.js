const fs = require('fs');
const path = require('path');
const cfg = require('../config');

module.exports = function mergeVisits(diffDir) {
  const pipeline = cfg.PIPELINES_MAP.VISITS;
  if (!pipeline) return [];

  const root = pipeline.roots[0];
  const file = path.join(diffDir, `${root}.json`);

  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
};