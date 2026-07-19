function renderChrome(activePage) {
  const header = document.createElement("div");
  header.className = "gov-header";
  header.innerHTML = `
    <div class="lines">
      <p class="top">Republic of the Philippines &middot; Department of Education &middot; ${SCHOOL.region}</p>
      <p class="division">${SCHOOL.division}</p>
      <p class="school">${SCHOOL.school}</p>
      <p class="subtitle">School Data Hub &mdash; School ID ${SCHOOL.schoolId}</p>
    </div>`;

  const navPages = [
    ["index.html", "Home"],
    ["mooe.html", "MOOE"],
    ["teachers-rooms.html", "Teachers vs. Rooms"],
  ];
  const nav = document.createElement("nav");
  nav.className = "site-nav";
  const linksHtml = navPages.map(([href, label]) =>
    `<a href="${href}"${href === activePage ? ' class="active"' : ''}>${label}</a>`
  ).join("");
  nav.innerHTML = `<div class="lines">${linksHtml}</div>`;

  document.body.insertBefore(nav, document.body.firstChild);
  document.body.insertBefore(header, document.body.firstChild);

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <span>${SCHOOL.headTitle}: ${SCHOOL.head}</span>
    <span>Data as of: ${REPORT_DATE}</span>`;
  document.body.appendChild(footer);
}
