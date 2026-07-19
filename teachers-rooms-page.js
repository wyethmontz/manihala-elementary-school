renderChrome("teachers-rooms.html");

const content = document.getElementById("content");
if (!TEACHERS_ROOMS.length) {
  content.innerHTML = `<p class="meta" style="margin:0">No data added yet. Fill in <code>TEACHERS_ROOMS</code> in
    <code>teachers-rooms-data.js</code> — one row per grade level: [name, teacher count, room count] —
    and this table will populate automatically.</p>`;
} else {
  let html = `<table><thead><tr>
    <th style="text-align:left">Grade Level</th><th>No. of Teachers</th><th>No. of Rooms</th><th>Ratio (Teachers:Rooms)</th>
  </tr></thead><tbody>`;
  let totalTeachers = 0, totalRooms = 0;
  TEACHERS_ROOMS.forEach(([name, teachers, rooms]) => {
    totalTeachers += teachers; totalRooms += rooms;
    const ratio = rooms ? (teachers/rooms).toFixed(2) : "—";
    html += `<tr><td style="text-align:left">${name}</td><td>${teachers}</td><td>${rooms}</td><td>${ratio}</td></tr>`;
  });
  const totalRatio = totalRooms ? (totalTeachers/totalRooms).toFixed(2) : "—";
  html += `<tr class="total-row"><td>TOTAL</td><td>${totalTeachers}</td><td>${totalRooms}</td><td>${totalRatio}</td></tr>`;
  html += "</tbody></table>";
  content.innerHTML = html;
}
