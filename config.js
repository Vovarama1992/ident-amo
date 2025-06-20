const PIPELINES = [
  { name: 'payments',        roots: ['order_payments_journal', 'payments_in'] },
  { name: 'treatment_plan',  roots: ['treatment_plans', 'treatment_plan_elements', 'treatment_plan_relations'] },
  { name: 'appointments',    roots: ['scheduled_receptions'] },
  { name: 'visits',          roots: ['receptions'] },
  { name: 'repeat_visits',   roots: ['receptions', 'treatment_plans'] }
];

const AMO = {
    URL: 'https://dentmaximum.amocrm.ru',
    TOKEN: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImU5N2RmNzYyZTAzYTI1MDY5NWM5N2Y3N2RlZTFjNWJjMzdmMDA3YThiMGQ5MGNkNzFiYTQ3ODkzMmIwNmJkZGM5YzE1N2Y4ODRkZDQxODhlIn0.eyJhdWQiOiI4YmNiNDZhZi01NjVjLTQxMTMtOWUzMi04OTY1MWU1ZWExNDgiLCJqdGkiOiJlOTdkZjc2MmUwM2EyNTA2OTVjOTdmNzdkZWUxYzViYzM3ZjAwN2E4YjBkOTBjZDcxYmE0Nzg5MzJiMDZiZGRjOWMxNTdmODg0ZGQ0MTg4ZSIsImlhdCI6MTc0NjQ0MjM4NSwibmJmIjoxNzQ2NDQyMzg1LCJleHAiOjE3ODEyMjI0MDAsInN1YiI6IjkwMDU5NTgiLCJncmFudF90eXBlIjoiIiwiYWNjb3VudF9pZCI6MzA3MTc2NTgsImJhc2VfZG9tYWluIjoiYW1vY3JtLnJ1IiwidmVyc2lvbiI6Miwic2NvcGVzIjpbImNybSIsImZpbGVzIiwiZmlsZXNfZGVsZXRlIiwibm90aWZpY2F0aW9ucyIsInB1c2hfbm90aWZpY2F0aW9ucyJdLCJoYXNoX3V1aWQiOiIxZTY3OTU0NS05YzEzLTRjM2YtYmNlMi0zMGUxZDQ0YTQ3MmEiLCJhcGlfZG9tYWluIjoiYXBpLWIuYW1vY3JtLnJ1In0.p6Pl__JhXqznXz0UU0S4VOx4xI1uw903OKpxwyEjzle57agLxMIG_7U6OjZ-YQYbRfh7JqYcQGKzaRpuskDjlPIgxS9vBNU1cHHbzKPViAT3OlrIyyvHKrqpp9-vt63rn4MNbRDuZvTeYLr5KtlLQWuqZgHVNmL_qk_KJuI57VAegSuPYfBT5mPLcrK0lfj9Ms2XSTkFfI5Lu4-teLyQv25VWJrgN6SFDmPU6_kixxpb4ACC_jIffxU-Po6I40qdazkKje8oX8qzheQJ9CHfIi2p0aRS4s1KpuggLPnTy6MlUsdb3f2LVqO-ET2V30Ix-urkfbH6dsAomPA09Mm6og'
  }

const PIPELINES_MAP = PIPELINES.reduce((acc, p) => {
  const key = p.name.toUpperCase().replace(/-/g, '_');
  acc[key] = p;
  return acc;
}, {});

module.exports = {
  SERVER:   'localhost\\PZSQLSERVER',
  USER:     'readonly_user',
  PASSWORD: 'U07cef1s9Tkc61rfYyA0BEZ43tdNyS',
  DATABASE: 'PZ',

  OUTPUT:   'output',
  PREVIOUS: 'previous',
  DIFF:     'diff',

  ROOTS: [
    { name: 'patients',                  sql: 'SELECT * FROM patients' },
    { name: 'payments_in',              sql: 'SELECT * FROM payments_in' },
    { name: 'order_payments_journal',  sql: 'SELECT * FROM order_payments_journal' },
    { name: 'treatment_plans',          sql: 'SELECT * FROM treatment_plans' },
    { name: 'treatment_plan_elements',  sql: 'SELECT * FROM treatment_plan_elements' },
    { name: 'treatment_plan_relations', sql: 'SELECT * FROM treatment_plan_relations' },
    { name: 'scheduled_receptions',     sql: 'SELECT * FROM scheduled_receptions' },
    { name: 'receptions',                sql: 'SELECT * FROM receptions' }
  ],

  PIPELINES,
  AMO,
  PIPELINES_MAP
};