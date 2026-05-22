const API = "/api";

const STATUS_LABELS = {
  scheduled: "Scheduled",
  finished: "Finished",
};

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

let alertTimeout;

function showAlert(message, type = "error") {
  const box = document.getElementById("alertBox");
  box.textContent = message;
  box.className = `alert alert-${type} visible`;
  clearTimeout(alertTimeout);
  alertTimeout = setTimeout(() => {
    box.classList.remove("visible");
  }, 4000);
}

function clearFieldError(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = "";
}

function setFieldError(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

function renderMatchCard(m) {
  const statusClass = m.status === "finished" ? "finished" : "scheduled";
  const label = STATUS_LABELS[m.status] || m.status;
  const score =
    m.home_score != null && m.away_score != null
      ? `${m.home_score} : ${m.away_score}`
      : "— : —";

  return `
    <article class="match-card ${statusClass}">
      <div class="match-info">
        <div class="match-teams">${escapeHtml(m.home_team)} vs ${escapeHtml(m.away_team)}</div>
        <div class="match-meta">${formatDate(m.match_date)}</div>
      </div>
      <div class="score">${score}</div>
      <div class="match-actions">
        <span class="badge badge-${m.status}">${label}</span>
        <button type="button" class="btn btn--ghost" aria-label="Delete match"
          data-match-id="${m.id}" data-match-label="${escapeAttr(m.home_team)} vs ${escapeAttr(m.away_team)}">Delete</button>
      </div>
    </article>
  `;
}

function renderEmptyMatches() {
  return `
    <div class="empty-state">
      <p>No matches scheduled yet.</p>
      <button type="button" class="btn btn--secondary" onclick="showTab('manage')">Go to Manage</button>
    </div>
  `;
}

function renderMatchSection(title, matches) {
  if (!matches.length) return "";
  return `
    <h2 class="section-title">${title}</h2>
    ${matches.map(renderMatchCard).join("")}
  `;
}

async function loadMatches() {
  const container = document.getElementById("matchList");
  container.innerHTML = '<div class="loading-state"><p>Loading matches…</p></div>';

  try {
    const matches = await fetchJSON(`${API}/matches/`);

    if (!matches.length) {
      container.innerHTML = renderEmptyMatches();
      return;
    }

    const upcoming = matches
      .filter((m) => m.status === "scheduled")
      .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));

    const finished = matches
      .filter((m) => m.status === "finished")
      .sort((a, b) => new Date(b.match_date) - new Date(a.match_date));

    let html = "";
    html += renderMatchSection("Upcoming", upcoming);
    html += renderMatchSection("Completed", finished);

    if (!upcoming.length && !finished.length) {
      container.innerHTML = renderEmptyMatches();
      return;
    }

    container.innerHTML = html;
    container.querySelectorAll("[data-match-id]").forEach((btn) => {
      btn.addEventListener("click", () =>
        deleteMatch(+btn.dataset.matchId, btn.dataset.matchLabel)
      );
    });
  } catch (err) {
    container.innerHTML = "";
    showAlert(`Could not load matches: ${err.message}`);
  }
}

async function loadTeams() {
  try {
    const teams = await fetchJSON(`${API}/teams/`);
    const opts = teams.length
      ? teams.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join("")
      : '<option value="">No teams yet</option>';

    document.getElementById("homeTeam").innerHTML = opts;
    document.getElementById("awayTeam").innerHTML = opts;

    const list = document.getElementById("teamsList");
    if (!teams.length) {
      list.innerHTML = '<span class="empty-state" style="padding:0.5rem;border:none;background:none"><p style="margin:0">Add teams before scheduling matches.</p></span>';
      return;
    }

    list.innerHTML = teams
      .map(
        (t) => `
      <span class="team-chip">
        ${escapeHtml(t.name)}
        <button type="button" class="btn-remove-team" data-team-id="${t.id}"
          data-team-name="${escapeAttr(t.name)}" aria-label="Remove ${escapeHtml(t.name)}">Remove</button>
      </span>
    `
      )
      .join("");

    list.querySelectorAll(".btn-remove-team").forEach((btn) => {
      btn.addEventListener("click", () =>
        deleteTeam(+btn.dataset.teamId, btn.dataset.teamName)
      );
    });
  } catch (err) {
    showAlert(`Could not load teams: ${err.message}`);
  }
}

async function loadStandings() {
  const tbody = document.getElementById("standingsBody");
  tbody.innerHTML =
    '<tr><td colspan="9"><div class="loading-state"><p>Loading standings…</p></div></td></tr>';

  try {
    const standings = await fetchJSON(`${API}/standings/`);

    if (!standings.length) {
      tbody.innerHTML =
        '<tr><td colspan="9"><div class="empty-state"><p>No standings yet. Add teams and finish matches.</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = standings
      .map(
        (t, i) => `
    <tr class="${i < 3 ? "row-top" : ""}">
      <td class="rank">${i + 1}</td>
      <td class="team-name">${escapeHtml(t.name)}</td>
      <td>${t.p}</td>
      <td>${t.w}</td>
      <td>${t.d}</td>
      <td>${t.l}</td>
      <td>${t.gf}</td>
      <td>${t.ga}</td>
      <td class="pts">${t.pts}</td>
    </tr>
  `
      )
      .join("");
  } catch (err) {
    tbody.innerHTML = "";
    showAlert(`Could not load standings: ${err.message}`);
  }
}

async function loadPendingMatches() {
  const select = document.getElementById("matchSelect");
  try {
    const matches = await fetchJSON(`${API}/matches/`);
    const pending = matches.filter((m) => m.status === "scheduled");

    select.innerHTML = pending.length
      ? pending
          .map(
            (m) =>
              `<option value="${m.id}">${escapeHtml(m.home_team)} vs ${escapeHtml(m.away_team)}</option>`
          )
          .join("")
      : '<option value="">No scheduled matches</option>';
    select.disabled = !pending.length;
  } catch (err) {
    showAlert(`Could not load match list: ${err.message}`);
  }
}

async function addTeam() {
  clearFieldError("teamNameError");
  const name = document.getElementById("teamName").value.trim();
  if (!name) {
    setFieldError("teamNameError", "Enter a team name.");
    return;
  }

  try {
    await fetchJSON(`${API}/teams/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    document.getElementById("teamName").value = "";
    showAlert("Team added successfully.", "success");
    await loadTeams();
    await loadPendingMatches();
  } catch (err) {
    setFieldError("teamNameError", err.message);
  }
}

async function deleteTeam(id, name) {
  if (!confirm(`Remove team "${name}"? This may fail if the team has matches.`)) return;

  try {
    await fetchJSON(`${API}/teams/${id}`, { method: "DELETE" });
    showAlert("Team removed.", "success");
    await loadTeams();
    await loadPendingMatches();
    await loadMatches();
    await loadStandings();
  } catch (err) {
    showAlert(err.message);
  }
}

async function addMatch() {
  clearFieldError("matchFormError");
  const home = +document.getElementById("homeTeam").value;
  const away = +document.getElementById("awayTeam").value;
  const date = document.getElementById("matchDate").value;

  if (!home || !away) {
    setFieldError("matchFormError", "Add at least two teams first.");
    return;
  }
  if (home === away) {
    setFieldError("matchFormError", "Home and away teams must be different.");
    return;
  }
  if (!date) {
    setFieldError("matchFormError", "Pick a date and time.");
    return;
  }

  try {
    await fetchJSON(`${API}/matches/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        home_team_id: home,
        away_team_id: away,
        match_date: new Date(date).toISOString(),
      }),
    });
    document.getElementById("matchDate").value = "";
    showAlert("Match scheduled.", "success");
    await loadMatches();
    await loadPendingMatches();
  } catch (err) {
    setFieldError("matchFormError", err.message);
  }
}

async function updateResult() {
  clearFieldError("resultFormError");
  const id = document.getElementById("matchSelect").value;
  const hs = document.getElementById("homeScore").value;
  const as = document.getElementById("awayScore").value;

  if (!id) {
    setFieldError("resultFormError", "No scheduled match selected.");
    return;
  }
  if (hs === "" || as === "") {
    setFieldError("resultFormError", "Enter scores for both teams.");
    return;
  }

  try {
    await fetchJSON(`${API}/matches/${id}/result`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ home_score: +hs, away_score: +as }),
    });
    document.getElementById("homeScore").value = "";
    document.getElementById("awayScore").value = "";
    showAlert("Result saved.", "success");
    await loadMatches();
    await loadPendingMatches();
  } catch (err) {
    setFieldError("resultFormError", err.message);
  }
}

async function deleteMatch(id, label) {
  if (!confirm(`Delete match "${label}"?`)) return;

  try {
    await fetchJSON(`${API}/matches/${id}`, { method: "DELETE" });
    showAlert("Match deleted.", "success");
    await loadMatches();
    await loadPendingMatches();
  } catch (err) {
    showAlert(err.message);
  }
}

function showTab(name) {
  document.querySelectorAll(".tab").forEach((tab) => {
    const isActive = tab.dataset.tab === name;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  document.querySelectorAll(".section").forEach((section) => {
    const isActive = section.id === name;
    section.classList.toggle("active", isActive);
    section.hidden = !isActive;
  });

  if (name === "matches") loadMatches();
  if (name === "standings") loadStandings();
  if (name === "manage") {
    loadTeams();
    loadPendingMatches();
  }
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => showTab(tab.dataset.tab));
});

document.getElementById("btnAddTeam").addEventListener("click", addTeam);
document.getElementById("btnAddMatch").addEventListener("click", addMatch);
document.getElementById("btnSaveResult").addEventListener("click", updateResult);

document.getElementById("teamName").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTeam();
});

loadMatches();
