(async function () {
  const isAdmin = await renderChrome("mooe.html");

  const res = await fetch("/api/mooe");
  const mooe = await res.json();

  document.getElementById("footerStatus").textContent = "Data as of: " + formatUpdatedAt(mooe.updatedAt);

  if (isAdmin) {
    document.getElementById("saveBar").style.display = "flex";
  }

  function renderChart() {
    const totals = periodTotals(mooe);
    const maxVal = Math.max(...mooe.downloaded, ...totals, 1);
    const grouped = document.getElementById("groupedChart");
    const groupLabels = document.getElementById("groupLabels");
    grouped.innerHTML = "";
    groupLabels.innerHTML = "";
    mooe.periods.forEach((label, i) => {
      const g = document.createElement("div");
      g.className = "group";
      const dPct = (mooe.downloaded[i]/maxVal*100).toFixed(1);
      const ePct = (totals[i]/maxVal*100).toFixed(1);
      g.innerHTML = `
        <div class="bar" style="height:${dPct}%; background:var(--series-1)" title="Downloaded ${label}: ${money(mooe.downloaded[i])}">
          <span class="val">${(mooe.downloaded[i]/1000).toFixed(0)}k</span>
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
    for (let i = 0; i < mooe.periods.length; i++) {
      if (totals[i] > mooe.downloaded[i] && mooe.downloaded[i] > 0) {
        calloutText += `${mooe.periods[i]} expenses (${money(totals[i])}) exceed the ${money(mooe.downloaded[i])} downloaded for that period by ${money(totals[i]-mooe.downloaded[i])}. `;
      }
    }
    const lastRecorded = mooe.periods.filter((_,i) => totals[i] > 0).length;
    const unrecorded = mooe.periods.slice(lastRecorded).join(", ");
    if (unrecorded) {
      calloutText += `${unrecorded} show funds downloaded but no expenses logged yet — those periods read as gaps in the record, not confirmed zero spending.`;
    }
    document.getElementById("callout").textContent = calloutText || "All recorded periods are within downloaded funds.";
  }

  function renderTable() {
    const totals = periodTotals(mooe);
    const table = document.getElementById("detailTable");

    let thead = "<thead><tr><th>Account Description</th>";
    mooe.periods.forEach(p => thead += `<th>${p}</th>`);
    thead += "<th>Total</th><th>% of Budget</th></tr></thead>";

    let tbody = "<tbody>";
    tbody += `<tr class="total-row"><td>Amount Downloaded</td>`;
    mooe.downloaded.forEach((v, i) => {
      tbody += isAdmin
        ? `<td><input type="number" step="0.01" min="0" data-downloaded="${i}" value="${v}" style="width:80px;text-align:right"></td>`
        : `<td>${fmt(v)}</td>`;
    });
    const dlSum = downloadedSum(mooe);
    tbody += `<td>${fmt(dlSum)}</td><td>${mooe.budget ? (dlSum/mooe.budget*100).toFixed(1) : '0.0'}%</td></tr>`;

    mooe.categories.forEach(([name, exp], ci) => {
      const total = exp.reduce((a,b)=>a+b,0);
      const isZero = total === 0;
      tbody += `<tr class="${isZero && !isAdmin ? 'zero' : ''}"><td>${name}</td>`;
      exp.forEach((v, i) => {
        tbody += isAdmin
          ? `<td><input type="number" step="0.01" min="0" data-cat="${ci}" data-period="${i}" value="${v || ''}" style="width:80px;text-align:right"></td>`
          : `<td>${v ? fmt(v) : '—'}</td>`;
      });
      tbody += `<td>${total ? fmt(total) : '—'}</td><td>${total ? (total/mooe.budget*100).toFixed(1)+'%' : '—'}</td></tr>`;
    });

    tbody += `<tr class="total-row"><td>TOTAL EXPENSES</td>`;
    totals.forEach((v,i) => {
      const cls = v > mooe.downloaded[i] && mooe.downloaded[i] > 0 ? ' class="over"' : '';
      tbody += `<td${cls}>${v ? fmt(v) : '—'}</td>`;
    });
    const grand = spentSum(mooe);
    tbody += `<td>${fmt(grand)}</td><td>${mooe.budget ? (grand/mooe.budget*100).toFixed(1) : '0.0'}%</td></tr>`;
    tbody += "</tbody>";

    table.innerHTML = thead + tbody;

    if (isAdmin) {
      table.addEventListener("input", (e) => {
        const ci = e.target.getAttribute("data-cat");
        const pi = e.target.getAttribute("data-period");
        const di = e.target.getAttribute("data-downloaded");
        const val = Number(e.target.value) || 0;
        if (ci !== null && pi !== null) {
          mooe.categories[ci][1][pi] = val;
        } else if (di !== null) {
          mooe.downloaded[di] = val;
        }
        renderChart();
        renderTotalsOnly();
      });
    }
  }

  // Recomputes just the total/percentage cells without rebuilding inputs (keeps focus while typing).
  function renderTotalsOnly() {
    const totals = periodTotals(mooe);
    const table = document.getElementById("detailTable");
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach((row, idx) => {
      if (idx === 0) {
        const cells = row.querySelectorAll("td");
        const dlSum = downloadedSum(mooe);
        cells[cells.length - 2].textContent = fmt(dlSum);
        cells[cells.length - 1].textContent = (mooe.budget ? (dlSum/mooe.budget*100).toFixed(1) : '0.0') + '%';
        return;
      }
      if (idx === rows.length - 1) return; // TOTAL EXPENSES row handled below
      const cat = mooe.categories[idx - 1];
      if (!cat) return;
      const total = cat[1].reduce((a,b)=>a+b,0);
      const cells = row.querySelectorAll("td");
      cells[cells.length - 2].textContent = total ? fmt(total) : "—";
      cells[cells.length - 1].textContent = total ? (total/mooe.budget*100).toFixed(1)+'%' : "—";
    });
    const lastRow = rows[rows.length - 1];
    const cells = lastRow.querySelectorAll("td");
    totals.forEach((v, i) => {
      cells[i + 1].textContent = v ? fmt(v) : "—";
      cells[i + 1].className = v > mooe.downloaded[i] && mooe.downloaded[i] > 0 ? "over" : "";
    });
    const grand = spentSum(mooe);
    cells[cells.length - 2].textContent = fmt(grand);
    cells[cells.length - 1].textContent = mooe.budget ? (grand/mooe.budget*100).toFixed(1)+'%' : "0.0%";
  }

  renderChart();
  renderTable();

  if (isAdmin) {
    document.getElementById("saveBtn").addEventListener("click", async () => {
      const statusEl = document.getElementById("saveStatus");
      statusEl.textContent = "Saving...";
      try {
        const res = await fetch("/api/mooe", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ budget: mooe.budget, downloaded: mooe.downloaded, categories: mooe.categories })
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          mooe.updatedAt = data.updatedAt;
          document.getElementById("footerStatus").textContent = "Data as of: " + formatUpdatedAt(mooe.updatedAt);
          statusEl.textContent = "Saved.";
        } else {
          statusEl.textContent = data.error || "Save failed.";
        }
      } catch {
        statusEl.textContent = "Network error — not saved.";
      }
    });
  }
})();
