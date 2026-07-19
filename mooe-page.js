renderChrome("mooe.html");

const totals = periodTotals();
const maxVal = Math.max(...DOWNLOADED, ...totals);
const grouped = document.getElementById("groupedChart");
const groupLabels = document.getElementById("groupLabels");
PERIODS.forEach((label, i) => {
  const g = document.createElement("div");
  g.className = "group";
  const dPct = (DOWNLOADED[i]/maxVal*100).toFixed(1);
  const ePct = (totals[i]/maxVal*100).toFixed(1);
  g.innerHTML = `
    <div class="bar" style="height:${dPct}%; background:var(--series-1)" title="Downloaded ${label}: ${money(DOWNLOADED[i])}">
      <span class="val">${(DOWNLOADED[i]/1000).toFixed(0)}k</span>
    </div>
    <div class="bar" style="height:${ePct}%; background:var(--series-2)" title="Expenses ${label}: ${money(totals[i])}">
      <span class="val">${totals[i] ? (totals[i]/1000).toFixed(0)+'k' : '—'}</span>
    </div>`;
  grouped.appendChild(g);
  const lbl = document.createElement("span");
  lbl.textContent = label;
  groupLabels.appendChild(lbl);
});

let calloutText = "";
for (let i = 0; i < PERIODS.length; i++) {
  if (totals[i] > DOWNLOADED[i] && DOWNLOADED[i] > 0) {
    calloutText += `${PERIODS[i]} expenses (${money(totals[i])}) exceed the ${money(DOWNLOADED[i])} downloaded for that period by ${money(totals[i]-DOWNLOADED[i])}. `;
  }
}
const lastRecorded = PERIODS.filter((_,i) => totals[i] > 0).length;
const unrecorded = PERIODS.slice(lastRecorded).join(", ");
if (unrecorded) {
  calloutText += `${unrecorded} show funds downloaded but no expenses logged yet — those periods read as gaps in the record, not confirmed zero spending.`;
}
document.getElementById("callout").textContent = calloutText || "All recorded periods are within downloaded funds.";

const table = document.getElementById("detailTable");
let thead = "<thead><tr><th>Account Description</th>";
PERIODS.forEach(p => thead += `<th>${p}</th>`);
thead += "<th>Total</th><th>% of Budget</th></tr></thead>";

let tbody = "<tbody>";
tbody += `<tr class="total-row"><td>Amount Downloaded</td>`;
DOWNLOADED.forEach(v => tbody += `<td>${fmt(v)}</td>`);
const dlSum = downloadedSum();
tbody += `<td>${fmt(dlSum)}</td><td>100.0%</td></tr>`;

CATEGORIES.forEach(([name, exp]) => {
  const total = exp.reduce((a,b)=>a+b,0);
  const isZero = total === 0;
  tbody += `<tr class="${isZero ? 'zero' : ''}"><td>${name}</td>`;
  exp.forEach(v => { tbody += `<td>${v ? fmt(v) : '—'}</td>`; });
  tbody += `<td>${total ? fmt(total) : '—'}</td><td>${total ? (total/BUDGET*100).toFixed(1)+'%' : '—'}</td></tr>`;
});

tbody += `<tr class="total-row"><td>TOTAL EXPENSES</td>`;
totals.forEach((v,i) => {
  const cls = v > DOWNLOADED[i] && DOWNLOADED[i] > 0 ? ' class="over"' : '';
  tbody += `<td${cls}>${v ? fmt(v) : '—'}</td>`;
});
const grand = spentSum();
tbody += `<td>${fmt(grand)}</td><td>${(grand/BUDGET*100).toFixed(1)}%</td></tr>`;
tbody += "</tbody>";

table.innerHTML = thead + tbody;
