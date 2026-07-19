// ---- Edit this file each time a new period is liquidated. Every page reads from here. ----

const REPORT_DATE = "March-April 2026 period"; // update this label each refresh

const SCHOOL = {
  region: "Region IV-B (MIMAROPA)",
  division: "Schools Division of Oriental Mindoro",
  school: "Manihala Elementary School",
  schoolId: "[School ID]",
  head: "Randy Medrano",
  headTitle: "School Head"
};

const BUDGET = 684000.00;

const PERIODS = ["Jan-Feb", "Mar-Apr", "May-Jun", "Jul-Aug", "Sep-Oct", "Nov-Dec"];

const DOWNLOADED = [113980.00, 102466.00, 211474.00, 155180.00, 48520.00, 52380.00];

// [category name, [expense per period x6]]
const CATEGORIES = [
  ["Cash in Bank",                              [0,0,0,0,0,0]],
  ["Accountable Forms",                         [0,0,0,0,0,0]],
  ["Travelling Expenses",                       [0,500.00,0,0,0,0]],
  ["ICT Training Exp.",                         [0,0,0,0,0,0]],
  ["Training Exp.",                             [1000.00,1000.00,0,0,0,0]],
  ["ICT Office Supplies",                       [18171.43,0,0,0,0,0]],
  ["Office Supplies Exp.",                      [48288.52,29089.37,0,0,0,0]],
  ["Food Supplies Exp.",                        [0,2340.00,0,0,0,0]],
  ["Drugs and Medicines",                       [0,0,0,0,0,0]],
  ["Fuel, Oil, and Lubricant",                  [660.94,709.82,0,0,0,0]],
  ["Semi Expendable Machinery",                 [0,0,0,0,0,0]],
  ["Semi Expendable Office Equipment",          [0,0,0,0,0,0]],
  ["Semi Expendable ICT Equipment",             [36480.00,0,0,0,0,0]],
  ["Semi Expendable Medical Equipment",         [0,0,0,0,0,0]],
  ["Semi Expendable Other Machinery & Eqpt.",   [0,0,0,0,0,0]],
  ["Semi Expendable Furniture & Fixtures",      [0,0,0,0,0,0]],
  ["Semi Expendable Sports Equipment",          [0,0,0,0,0,0]],
  ["Semi Expendable Printing Equipment",        [0,0,0,0,0,0]],
  ["Other Supp. And Materials Exp.",            [0,1080.00,0,0,0,0]],
  ["Water Expenses",                            [0,0,0,0,0,0]],
  ["Electricity Expenses",                      [4149.11,4458.81,0,0,0,0]],
  ["Postage and Courier Services",              [0,0,0,0,0,0]],
  ["Telephone Expenses Mobile",                 [1000.00,1000.00,0,0,0,0]],
  ["Telephone Expenses Landline",               [0,0,0,0,0,0]],
  ["Internet Subscription Expenses",            [0,0,0,0,0,0]],
  ["Cable, Satellite, Telegraph and Radio",     [0,0,0,0,0,0]],
  ["Other General Services",                    [2730.00,15980.00,0,0,0,0]],
  ["R&M School Buildings",                      [0,45648.00,0,0,0,0]],
  ["R&M Office Equipment",                      [0,0,0,0,0,0]],
  ["R&M ICT Equipment",                         [0,0,0,0,0,0]],
  ["R&M Furniture and Fixtures Equipment",      [0,0,0,0,0,0]],
  ["Fidelity Bond",                             [1500.00,0,0,0,0,0]],
  ["Printing and Publication Expenses",         [0,2660.00,0,0,0,0]],
  ["Transportation and Delivery Exp.",          [0,0,0,0,0,0]],
  ["Rents Equipment",                           [0,0,0,0,0,0]],
];

// ---- shared helpers, used by every page ----
function fmt(n) {
  return (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function money(n) { return "₱" + fmt(n); }

function periodTotals() {
  const totals = [0,0,0,0,0,0];
  CATEGORIES.forEach(([, exp]) => exp.forEach((v,i) => totals[i]+=v));
  return totals;
}
function downloadedSum() { return DOWNLOADED.reduce((a,b)=>a+b,0); }
function spentSum() { return periodTotals().reduce((a,b)=>a+b,0); }
function rankedCategories() {
  return CATEGORIES
    .map(([name, exp]) => [name, exp.reduce((a,b)=>a+b,0)])
    .filter(([,total]) => total > 0)
    .sort((a,b) => b[1]-a[1]);
}
