const fs = require('fs');
const path = require('path');
const cfg = require('../config');

module.exports = function mergeTreatmentPlan(diffDir) {
  const pipeline = cfg.PIPELINES_MAP.TREATMENT_PLAN;
  if (!pipeline) return [];

  const [plansRoot, elementsRoot, relationsRoot] = pipeline.roots;

  const plans = tryLoad(path.join(diffDir, `${plansRoot}.json`));
  const elements = tryLoad(path.join(diffDir, `${elementsRoot}.json`));
  const relations = tryLoad(path.join(diffDir, `${relationsRoot}.json`));

  return plans.map(plan => {
    const planId = plan.ID;
    const relatedElements = elements.filter(e => e.ID_TreatmentPlans === planId);
    relatedElements.forEach(e => {
      e.relations = relations.filter(r => r.ID_TreatmentPlanElements === e.ID);
    });
    plan.elements = relatedElements;
    return plan;
  });

  function tryLoad(filePath) {
    if (!fs.existsSync(filePath)) return [];
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      return [];
    }
  }
};