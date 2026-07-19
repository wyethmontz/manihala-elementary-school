// Renders header/nav/footer, and resolves to whether the current visitor is an authenticated admin.
// Guests (the default, e.g. the superintendent) always get isAdmin === false and read-only pages.
async function renderChrome(activePage) {
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
  nav.innerHTML = `<div class="lines" style="justify-content:space-between">
    <div>${linksHtml}</div>
    <div id="authArea" style="display:flex;align-items:center"></div>
  </div>`;

  document.body.insertBefore(nav, document.body.firstChild);
  document.body.insertBefore(header, document.body.firstChild);

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `<span>${SCHOOL.headTitle}: ${SCHOOL.head}</span><span id="footerStatus"></span>`;
  document.body.appendChild(footer);

  let isAdmin = false;
  try {
    const res = await fetch("/api/whoami");
    const data = await res.json();
    isAdmin = !!data.isAdmin;
  } catch {
    isAdmin = false;
  }

  const authArea = document.getElementById("authArea");
  if (isAdmin) {
    authArea.innerHTML = `<span style="font-size:12px;color:var(--good);margin-right:10px">Admin</span>
      <a href="#" id="logoutLink" style="font-size:13px;font-weight:600;color:var(--text-secondary)">Log out</a>`;
    document.getElementById("logoutLink").addEventListener("click", async (e) => {
      e.preventDefault();
      await fetch("/api/logout", { method: "POST" });
      location.reload();
    });
  } else {
    authArea.innerHTML = `<a href="#" id="loginLink" style="font-size:13px;font-weight:600;color:var(--text-secondary)">Admin Login</a>`;
    document.getElementById("loginLink").addEventListener("click", (e) => {
      e.preventDefault();
      showLoginModal();
    });
  }

  return isAdmin;
}

function showLoginModal() {
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:1000";
  overlay.innerHTML = `
    <form id="loginForm" style="background:var(--surface-1);border:1px solid var(--border);border-radius:10px;padding:20px;width:280px;box-shadow:0 8px 24px rgba(0,0,0,0.2)">
      <h3 style="margin:0 0 12px;font-size:15px">Admin Login</h3>
      <input type="password" id="loginPassword" placeholder="Password" autocomplete="current-password"
        style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--page);color:var(--text-primary);margin-bottom:10px;box-sizing:border-box">
      <div id="loginError" style="color:var(--critical);font-size:12px;margin-bottom:8px;display:none"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button type="button" id="loginCancel" style="background:transparent;border:1px solid var(--border);color:var(--text-primary);padding:7px 12px;border-radius:6px;font-size:13px;cursor:pointer">Cancel</button>
        <button type="submit" style="background:var(--series-1);border:none;color:#fff;padding:7px 12px;border-radius:6px;font-size:13px;cursor:pointer">Log in</button>
      </div>
    </form>`;
  document.body.appendChild(overlay);
  document.getElementById("loginPassword").focus();
  document.getElementById("loginCancel").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = document.getElementById("loginPassword").value;
    const errEl = document.getElementById("loginError");
    errEl.style.display = "none";
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        location.reload();
      } else {
        errEl.textContent = data.error || "Invalid credentials.";
        errEl.style.display = "block";
      }
    } catch {
      errEl.textContent = "Network error. Try again.";
      errEl.style.display = "block";
    }
  });
}
