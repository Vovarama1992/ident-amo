const fs = require('fs');
const path = require('path');
const cfg = require('../config');

module.exports = function mergeRepeatVisits(diffDir) {
  const pipeline = cfg.PIPELINES_MAP.REPEAT_VISITS;
  if (!pipeline) return [];

  const [receptionsRoot, treatmentPlansRoot] = pipeline.roots;

  const recPath = path.join(diffDir, `${receptionsRoot}.json`);
  const planPath = path.join(diffDir, `${treatmentPlansRoot}.json`);

  const recs = fs.existsSync(recPath) ? JSON.parse(fs.readFileSync(recPath, 'utf8')) : [];
  const plans = fs.existsSync(planPath) ? JSON.parse(fs.readFileSync(planPath, 'utf8')) : [];

  return [{ receptions: recs, treatment_plans: plans }];
};