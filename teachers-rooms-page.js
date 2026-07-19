(async function () {
  const isAdmin = await renderChrome("teachers-rooms.html");

  const res = await fetch("/api/teachers-rooms");
  const data = await res.json();
  let rows = data.rows || [];

  document.getElementById("footerStatus").textContent = "Data as of: " + formatUpdatedAt(data.updatedAt);
  if (isAdmin) document.getElementById("saveBar").style.display = "flex";

  function render() {
    const content = document.getElementById("content");

    if (!rows.length && !isAdmin) {
      content.innerHTML = `<p class="meta" style="margin:0">No data added yet.</p>`;
      return;
    }

    let html = `<table><thead><tr>
      <th style="text-align:left">Grade Level</th><th>No. of Teachers</th><th>No. of Rooms</th><th>Ratio (Teachers:Rooms)</th>${isAdmin ? '<th></th>' : ''}
    </tr></thead><tbody>`;
    let totalTeachers = 0, totalRooms = 0;
    rows.forEach(([name, teachers, rooms], i) => {
      totalTeachers += Number(teachers) || 0;
      totalRooms += Number(rooms) || 0;
      const ratio = rooms ? (teachers/rooms).toFixed(2) : "—";
      if (isAdmin) {
        html += `<tr>
          <td style="text-align:left"><input data-row="${i}" data-field="name" value="${name}" style="width:160px"></td>
          <td><input type="number" min="0" step="1" data-row="${i}" data-field="teachers" value="${teachers}" style="width:70px;text-align:right"></td>
          <td><input type="number" min="0" step="1" data-row="${i}" data-field="rooms" value="${rooms}" style="width:70px;text-align:right"></td>
          <td>${ratio}</td>
          <td><a href="#" data-remove="${i}" style="color:var(--critical);font-size:12px">Remove</a></td>
        </tr>`;
      } else {
        html += `<tr><td style="text-align:left">${name}</td><td>${teachers}</td><td>${rooms}</td><td>${ratio}</td></tr>`;
      }
    });
    const totalRatio = totalRooms ? (totalTeachers/totalRooms).toFixed(2) : "—";
    html += `<tr class="total-row"><td>TOTAL</td><td>${totalTeachers}</td><td>${totalRooms}</td><td>${totalRatio}</td>${isAdmin ? '<td></td>' : ''}</tr>`;
    html += "</tbody></table>";
    content.innerHTML = html;

    if (isAdmin) {
      content.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", () => {
          const r = Number(input.getAttribute("data-row"));
          const field = input.getAttribute("data-field");
          if (field === "name") rows[r][0] = input.value;
          if (field === "teachers") rows[r][1] = Number(input.value) || 0;
          if (field === "rooms") rows[r][2] = Number(input.value) || 0;
          render();
        });
      });
      content.querySelectorAll("[data-remove]").forEach(link => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          rows.splice(Number(link.getAttribute("data-remove")), 1);
          render();
        });
      });
    }
  }

  render();

  if (isAdmin) {
    document.getElementById("addRowBtn").addEventListener("click", () => {
      rows.push(["New Grade Level", 0, 0]);
      render();
    });

    document.getElementById("saveBtn").addEventListener("click", async () => {
      const statusEl = document.getElementById("saveStatus");
      statusEl.textContent = "Saving...";
      try {
        const res = await fetch("/api/teachers-rooms", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rows)
        });
        const result = await res.json();
        if (res.ok && result.ok) {
          document.getElementById("footerStatus").textContent = "Data as of: " + formatUpdatedAt(result.updatedAt);
          statusEl.textContent = "Saved.";
        } else {
          statusEl.textContent = result.error || "Save failed.";
        }
      } catch {
        statusEl.textContent = "Network error — not saved.";
      }
    });
  }
})();
