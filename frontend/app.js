const API = "http://192.168.49.2:31000";

async function loadMatches() {
  const res = await fetch(`${API}/matches/`);
  const matches = await res.json();
  const container = document.getElementById("matches");
  if (!matches.length) {
    container.innerHTML = "<p>No matches yet.</p>";
    return;
  }
  container.innerHTML = matches.map(m => `
    <div class="card">
      <div><strong>#${m.id}</strong> | ${m.sport.toUpperCase()} | ${new Date(m.match_date).toLocaleString()}</div>
      <div>${m.home_team} <span class="score">${m.home_score ?? "—"} : ${m.away_score ?? "—"}</span> ${m.away_team}</div>
      <div class="status-${m.status}">${m.status}</div>
    </div>
  `).join("");
}

async function loadTeams() {
  const res = await fetch(`${API}/teams/`);
  const teams = await res.json();
  ["homeTeam", "awayTeam"].forEach(id => {
    document.getElementById(id).innerHTML = teams
      .map(t => `<option value="${t.id}">${t.name}</option>`)
      .join("");
  });
}

async function addTeam() {
  await fetch(`${API}/teams/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("teamName").value,
      sport: document.getElementById("sport").value
    })
  });
  loadTeams();
  loadMatches();
}

async function addMatch() {
  await fetch(`${API}/matches/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      home_team_id: +document.getElementById("homeTeam").value,
      away_team_id: +document.getElementById("awayTeam").value,
      match_date: new Date(document.getElementById("matchDate").value).toISOString()
    })
  });
  loadMatches();
}

async function updateResult() {
  await fetch(`${API}/matches/${document.getElementById("matchId").value}/result`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      home_score: +document.getElementById("homeScore").value,
      away_score: +document.getElementById("awayScore").value
    })
  });
  loadMatches();
}

loadMatches();
loadTeams();