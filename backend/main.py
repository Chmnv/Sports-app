
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
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
    sport: str

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
    db_team = models.Team(**team.model_dump())
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team

@app.get("/teams/")
def get_teams(db: Session = Depends(database.get_db)):
    return db.query(models.Team).all()

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
            "sport": m.home_team.sport,
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

@app.get("/health")
def health():
    return {"status": "ok"}