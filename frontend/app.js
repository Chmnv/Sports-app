const API = "/api";

async function loadMatches() {
  const res = await fetch(`${API}/matches/`);
  const matches = await res.json();
  const container = document.getElementById("matchList");

  if (!matches.length) {
    container.innerHTML = "<p style='color:#888;padding:20px'>No matches yet.</p>";
    return;
  }

  container.innerHTML = matches.map(m => `
    <div class="card ${m.status}">
      <div>
        <div class="match-teams">${m.home_team} vs ${m.away_team}</div>
        <div class="match-meta">⚽ ${new Date(m.match_date).toLocaleString()}</div>
      </div>
      <div class="score">${m.home_score ?? "—"} : ${m.away_score ?? "—"}</div>
      <span class="badge badge-${m.status}">${m.status}</span>
      <button class="delete-btn" onclick="deleteMatch(${m.id})">🗑</button>
    </div>
  `).join("");
}

async function loadTeams() {
  const res = await fetch(`${API}/teams/`);
  const teams = await res.json();
  const opts = teams.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
  document.getElementById("homeTeam").innerHTML = opts;
  document.getElementById("awayTeam").innerHTML = opts;
}

async function loadStandings() {
  const res = await fetch(`${API}/standings/`);
  const standings = await res.json();
  document.getElementById("standingsBody").innerHTML = standings.map((t, i) => `
    <tr>
      <td class="rank">${i + 1}</td>
      <td>${t.name}</td>
      <td>${t.p}</td>
      <td>${t.w}</td>
      <td>${t.d}</td>
      <td>${t.l}</td>
      <td>${t.gf}</td>
      <td>${t.ga}</td>
      <td class="pts">${t.pts}</td>
    </tr>
  `).join("");
}

async function loadPendingMatches() {
  const res = await fetch(`${API}/matches/`);
  const matches = await res.json();
  const pending = matches.filter(m => m.status === "scheduled");
  document.getElementById("matchSelect").innerHTML = pending.length
    ? pending.map(m => `<option value="${m.id}">${m.home_team} vs ${m.away_team}</option>`).join("")
    : "<option>No scheduled matches</option>";
}

async function addTeam() {
  const name = document.getElementById("teamName").value.trim();
  if (!name) return;
  await fetch(`${API}/teams/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  document.getElementById("teamName").value = "";
  loadTeams();
  loadPendingMatches();
}

async function addMatch() {
  const home = +document.getElementById("homeTeam").value;
  const away = +document.getElementById("awayTeam").value;
  const date = document.getElementById("matchDate").value;
  if (home === away || !date) return;
  await fetch(`${API}/matches/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      home_team_id: home,
      away_team_id: away,
      match_date: new Date(date).toISOString()
    })
  });
  loadMatches();
  loadPendingMatches();
}

async function updateResult() {
  const id = document.getElementById("matchSelect").value;
  const hs = +document.getElementById("homeScore").value;
  const as = +document.getElementById("awayScore").value;
  await fetch(`${API}/matches/${id}/result`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ home_score: hs, away_score: as })
  });
  loadMatches();
  loadPendingMatches();
}

async function deleteMatch(id) {
  await fetch(`${API}/matches/${id}`, { method: "DELETE" });
  loadMatches();
  loadPendingMatches();
}

function showTab(name) {
  document.querySelectorAll(".tab").forEach((t, i) =>
    t.classList.toggle("active", ["matches", "standings", "manage"][i] === name)
  );
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(name).classList.add("active");
  if (name === "standings") loadStandings();
  if (name === "manage") { loadTeams(); loadPendingMatches(); }
}

loadMatches();