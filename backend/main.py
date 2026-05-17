from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import models, database

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Sports Schedule API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Schemas ---
class TeamCreate(BaseModel):
    name: str

class MatchCreate(BaseModel):
    home_team_id: int
    away_team_id: int
    match_date: datetime

class MatchResult(BaseModel):
    home_score: int
    away_score: int

# --- Teams ---
@app.post("/teams/")
def create_team(team: TeamCreate, db: Session = Depends(database.get_db)):
    db_team = models.Team(name=team.name, sport="football")
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team

@app.get("/teams/")
def get_teams(db: Session = Depends(database.get_db)):
    return db.query(models.Team).all()

@app.delete("/teams/{team_id}")
def delete_team(team_id: int, db: Session = Depends(database.get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    db.delete(team)
    db.commit()
    return {"message": "Team deleted"}

# --- Matches ---
@app.post("/matches/")
def create_match(match: MatchCreate, db: Session = Depends(database.get_db)):
    db_match = models.Match(**match.model_dump())
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return db_match

@app.get("/matches/")
def get_matches(db: Session = Depends(database.get_db)):
    matches = db.query(models.Match).all()
    result = []
    for m in matches:
        result.append({
            "id": m.id,
            "home_team": m.home_team.name,
            "away_team": m.away_team.name,
            "match_date": m.match_date,
            "home_score": m.home_score,
            "away_score": m.away_score,
            "status": m.status,
        })
    return result

@app.put("/matches/{match_id}/result")
def update_result(match_id: int, result: MatchResult, db: Session = Depends(database.get_db)):
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    match.home_score = result.home_score
    match.away_score = result.away_score
    match.status = "finished"
    db.commit()
    return {"message": "Result updated"}

@app.delete("/matches/{match_id}")
def delete_match(match_id: int, db: Session = Depends(database.get_db)):
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    db.delete(match)
    db.commit()
    return {"message": "Match deleted"}

# --- Standings ---
@app.get("/standings/")
def get_standings(db: Session = Depends(database.get_db)):
    teams = db.query(models.Team).all()
    matches = db.query(models.Match).filter(models.Match.status == "finished").all()

    stats = {t.id: {"name": t.name, "p": 0, "w": 0, "d": 0, "l": 0, "gf": 0, "ga": 0, "pts": 0} for t in teams}

    for m in matches:
        h, a = stats[m.home_team_id], stats[m.away_team_id]
        h["p"] += 1; a["p"] += 1
        h["gf"] += m.home_score; h["ga"] += m.away_score
        a["gf"] += m.away_score; a["ga"] += m.home_score
        if m.home_score > m.away_score:
            h["w"] += 1; h["pts"] += 3; a["l"] += 1
        elif m.home_score < m.away_score:
            a["w"] += 1; a["pts"] += 3; h["l"] += 1
        else:
            h["d"] += 1; a["d"] += 1; h["pts"] += 1; a["pts"] += 1

    return sorted(stats.values(), key=lambda x: (-x["pts"], -(x["gf"] - x["ga"])))

@app.get("/health")
def health():
    return {"status": "ok"}