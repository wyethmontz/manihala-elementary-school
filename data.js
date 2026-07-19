// ---- Static school identity only. Editable MOOE / Teachers-Rooms data now lives in KV, fetched via /api/*. ----

const SCHOOL = {
  region: "Region IV-B (MIMAROPA)",
  division: "Schools Division of Oriental Mindoro",
  school: "Manihala Elementary School",
  schoolId: "[School ID]",
  head: "Randy Medrano",
  headTitle: "School Head"
};

// ---- shared helpers, used by every page. All take the fetched data object explicitly. ----
function fmt(n) {
  return (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function money(n) { return "₱" + fmt(n); }

function periodTotals(mooe) {
  const totals = [0,0,0,0,0,0];
  mooe.categories.forEach(([, exp]) => exp.forEach((v,i) => totals[i] += Number(v) || 0));
  return totals;
}
function downloadedSum(mooe) { return mooe.downloaded.reduce((a,b)=>a+(Number(b)||0),0); }
function spentSum(mooe) { return periodTotals(mooe).reduce((a,b)=>a+b,0); }
function rankedCategories(mooe) {
  return mooe.categories
    .map(([name, exp]) => [name, exp.reduce((a,b)=>a+(Number(b)||0),0)])
    .filter(([,total]) => total > 0)
    .sort((a,b) => b[1]-a[1]);
}
function formatUpdatedAt(iso) {
  if (!iso) return "never";
  const d = new Date(iso);
  return d.toLocaleString();
}
