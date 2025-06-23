const fs = require('fs');
const path = require('path');
const cfg = require('../config');

module.exports = function mergeRepeatVisits(diffDir) {
  const pipeline = cfg.PIPELINES_MAP.REPEAT_VISITS;
  if (!pipeline) return [];

  const [receptionsRoot, treatmentPlansRoot] = pipeline.roots;

  const recPath = path.join(diffDir, `${receptionsRoot}.json`);
  const planPath = path.join(diffDir, `${treatmentPlansRoot}.json`);
  const patientsRoot = cfg.ROOTS.find(r => r.name === 'Patients');
  const patientsPath = patientsRoot ? path.join(diffDir, `${patientsRoot.name}.json`) : null;

  const recs = fs.existsSync(recPath) ? JSON.parse(fs.readFileSync(recPath, 'utf8')) : [];
  const plans = fs.existsSync(planPath) ? JSON.parse(fs.readFileSync(planPath, 'utf8')) : [];
  const patients = patientsPath && fs.existsSync(patientsPath) ? JSON.parse(fs.readFileSync(patientsPath, 'utf8')) : [];

  return [{ receptions: recs, treatment_plans: plans, patients }];
};