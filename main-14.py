"""
YOU-N-I-VERSE Resonance Network -- FastAPI backend.

Real chart engine (hd_engine.py, JPL ephemeris) + real 9-field resonance
matching (resonance.py) + SQLite persistence. No placeholder math, no fake
hashed "random" charts, no dead lastapp.dev calls.
"""

from __future__ import annotations
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json
import sqlite3
import uuid
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import hd_engine as hd
import resonance as res
import resonance_market as market

app = FastAPI(title="YOU-N-I-VERSE Resonance Network API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "resonance.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS profiles (
        user_id TEXT PRIMARY KEY,
        display_name TEXT,
        birth_date TEXT,
        birth_time TEXT,
        birth_lat REAL,
        birth_lng REAL,
        birth_location TEXT,
        current_state TEXT,
        challenge TEXT,
        dream TEXT,
        skills TEXT,
        needs TEXT,
        natal_report TEXT,
        field_state TEXT
    );
    CREATE TABLE IF NOT EXISTS daily_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        log_date TEXT,
        resonance_score REAL,
        mood_score INTEGER,
        note TEXT,
        selected_tags TEXT
    );
    CREATE TABLE IF NOT EXISTS pods (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        resonance_theme TEXT,
        status TEXT,
        created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS pod_members (
        pod_id TEXT,
        user_id TEXT,
        joined_at TEXT,
        PRIMARY KEY (pod_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS pod_messages (
        id TEXT PRIMARY KEY,
        pod_id TEXT,
        user_id TEXT,
        message TEXT,
        created_at TEXT
    );
    """)
    conn.commit()
    conn.close()


init_db()
_market_init_conn = get_db()
market.init_market_tables(_market_init_conn)
_market_init_conn.close()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class BirthData(BaseModel):
    date: str          # "YYYY-MM-DD"
    time: str          # "HH:MM" (local time at birth location)
    utc_offset_hours: float = 0.0
    latitude: float = 0.0
    longitude: float = 0.0
    location_label: Optional[str] = None


class ProfileCreate(BaseModel):
    email: str
    display_name: str
    birth: BirthData
    current_state: Optional[str] = ""
    challenge: Optional[str] = ""
    dream: Optional[str] = ""
    skills: List[str] = []
    needs: List[str] = []


class DailyLogCreate(BaseModel):
    user_id: str
    mood_score: int
    note: Optional[str] = ""
    selected_tags: List[str] = []


class MatchRequest(BaseModel):
    user_id: str
    candidate_ids: Optional[List[str]] = None  # if omitted, match against all users


class PodCreate(BaseModel):
    name: str
    description: str
    resonance_theme: str


class PodJoin(BaseModel):
    pod_id: str
    user_id: str


class PodMessageCreate(BaseModel):
    pod_id: str
    user_id: str
    message: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _birth_to_utc(birth: BirthData) -> datetime:
    local_dt = datetime.fromisoformat(f"{birth.date}T{birth.time}:00")
    return local_dt - timedelta(hours=birth.utc_offset_hours)


def _compute_and_store_chart(user_id: str, birth: BirthData, conn: sqlite3.Connection):
    birth_utc = _birth_to_utc(birth)
    report = hd.full_natal_report(birth_utc)
    fields = res.fields_from_natal_report(report)
    field_json = {k: vars(v) for k, v in fields.items()}
    conn.execute(
        "UPDATE profiles SET natal_report = ?, field_state = ? WHERE user_id = ?",
        (json.dumps(report), json.dumps(field_json), user_id),
    )
    conn.commit()
    return report, fields


def _load_fields(row) -> Dict[str, res.FieldState]:
    raw = json.loads(row["field_state"])
    return {k: res.FieldState(**v) for k, v in raw.items()}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {"status": "ok", "service": "YOU-N-I-VERSE Resonance Network"}


@app.post("/api/chart/calculate")
async def calculate_chart(birth: BirthData):
    """Calculate a real natal chart without creating a user (preview mode)."""
    birth_utc = _birth_to_utc(birth)
    report = hd.full_natal_report(birth_utc)
    return report


@app.post("/api/profile/create")
async def create_profile(payload: ProfileCreate):
    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (payload.email,)).fetchone()
    if existing:
        user_id = existing["id"]
    else:
        user_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)",
            (user_id, payload.email, datetime.utcnow().isoformat()),
        )

    conn.execute(
        """INSERT OR REPLACE INTO profiles
           (user_id, display_name, birth_date, birth_time, birth_lat, birth_lng,
            birth_location, current_state, challenge, dream, skills, needs,
            natal_report, field_state)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '{}', '{}')""",
        (user_id, payload.display_name, payload.birth.date, payload.birth.time,
         payload.birth.latitude, payload.birth.longitude, payload.birth.location_label,
         payload.current_state, payload.challenge, payload.dream,
         json.dumps(payload.skills), json.dumps(payload.needs)),
    )
    conn.commit()

    report, fields = _compute_and_store_chart(user_id, payload.birth, conn)
    conn.close()

    return {
        "user_id": user_id,
        "natal_report": report,
        "field_state": {k: vars(v) for k, v in fields.items()},
        "network_coherence": res.network_coherence(fields),
    }


@app.get("/api/profile/{user_id}")
async def get_profile(user_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {
        "user_id": row["user_id"],
        "display_name": row["display_name"],
        "natal_report": json.loads(row["natal_report"]) if row["natal_report"] else {},
        "field_state": json.loads(row["field_state"]) if row["field_state"] else {},
    }


@app.post("/api/daily-log/create")
async def create_daily_log(payload: DailyLogCreate):
    conn = get_db()
    row = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (payload.user_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Profile not found")

    fields = _load_fields(row)
    coherence = res.network_coherence(fields)
    # Blend chart-coherence with today's self-reported mood (1-10 -> 0-1)
    mood_norm = max(0.0, min(1.0, payload.mood_score / 10.0))
    resonance_score = round(0.6 * coherence + 0.4 * mood_norm, 4)

    log_id = str(uuid.uuid4())
    conn.execute(
        """INSERT INTO daily_logs (id, user_id, log_date, resonance_score, mood_score, note, selected_tags)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (log_id, payload.user_id, datetime.utcnow().date().isoformat(), resonance_score,
         payload.mood_score, payload.note, json.dumps(payload.selected_tags)),
    )
    conn.commit()
    conn.close()
    return {"id": log_id, "resonance_score": resonance_score}


@app.get("/api/daily-log/{user_id}")
async def get_daily_logs(user_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM daily_logs WHERE user_id = ? ORDER BY log_date DESC", (user_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/match/calculate")
async def calculate_match(payload: MatchRequest):
    conn = get_db()
    me = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (payload.user_id,)).fetchone()
    if not me:
        conn.close()
        raise HTTPException(status_code=404, detail="Profile not found")
    my_fields = _load_fields(me)

    if payload.candidate_ids:
        placeholders = ",".join("?" for _ in payload.candidate_ids)
        candidates = conn.execute(
            f"SELECT * FROM profiles WHERE user_id IN ({placeholders}) AND user_id != ?",
            (*payload.candidate_ids, payload.user_id),
        ).fetchall()
    else:
        candidates = conn.execute(
            "SELECT * FROM profiles WHERE user_id != ?", (payload.user_id,)
        ).fetchall()
    conn.close()

    results = []
    for cand in candidates:
        try:
            cand_fields = _load_fields(cand)
        except Exception:
            continue
        score = res.resonance_score(my_fields, cand_fields)
        results.append({
            "user_id": cand["user_id"],
            "display_name": cand["display_name"],
            **score,
        })

    results.sort(key=lambda r: r["resonance_index"], reverse=True)
    return {"matches": results}


@app.post("/api/pod/create")
async def create_pod(payload: PodCreate):
    conn = get_db()
    pod_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO pods (id, name, description, resonance_theme, status, created_at) VALUES (?, ?, ?, ?, 'active', ?)",
        (pod_id, payload.name, payload.description, payload.resonance_theme, datetime.utcnow().isoformat()),
    )
    conn.commit()
    conn.close()
    return {"id": pod_id}


@app.get("/api/pod/list")
async def list_pods():
    conn = get_db()
    rows = conn.execute("SELECT * FROM pods WHERE status = 'active'").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/api/pod/{pod_id}")
async def get_pod(pod_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM pods WHERE id = ?", (pod_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Pod not found")
    return dict(row)


@app.post("/api/pod/join")
async def join_pod(payload: PodJoin):
    conn = get_db()
    conn.execute(
        "INSERT OR IGNORE INTO pod_members (pod_id, user_id, joined_at) VALUES (?, ?, ?)",
        (payload.pod_id, payload.user_id, datetime.utcnow().isoformat()),
    )
    conn.commit()
    conn.close()
    return {"status": "joined"}


@app.get("/api/pod/{pod_id}/members")
async def pod_members(pod_id: str):
    conn = get_db()
    rows = conn.execute(
        """SELECT pm.user_id, p.display_name, pm.joined_at
           FROM pod_members pm JOIN profiles p ON p.user_id = pm.user_id
           WHERE pm.pod_id = ?""", (pod_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/pod/message")
async def post_pod_message(payload: PodMessageCreate):
    conn = get_db()
    msg_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO pod_messages (id, pod_id, user_id, message, created_at) VALUES (?, ?, ?, ?, ?)",
        (msg_id, payload.pod_id, payload.user_id, payload.message, datetime.utcnow().isoformat()),
    )
    conn.commit()
    conn.close()
    return {"id": msg_id}


@app.get("/api/pod/{pod_id}/messages")
async def pod_messages(pod_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM pod_messages WHERE pod_id = ? ORDER BY created_at ASC", (pod_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/api/pod/{pod_id}/fit/{user_id}")
async def pod_fit(pod_id: str, user_id: str):
    """Real resonance fit between a user and a pod's current members --
    the average of the same pairwise resonance_score used for 1:1 matching,
    not a theme-keyword guess."""
    conn = get_db()
    me = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,)).fetchone()
    if not me:
        conn.close()
        raise HTTPException(status_code=404, detail="Profile not found")

    members = conn.execute(
        """SELECT p.* FROM pod_members pm JOIN profiles p ON p.user_id = pm.user_id
           WHERE pm.pod_id = ? AND pm.user_id != ?""", (pod_id, user_id)
    ).fetchall()
    conn.close()

    if not members:
        return {"pod_id": pod_id, "user_id": user_id, "fit": None, "member_count": 0,
                "note": "No members yet -- be the first to set the tone."}

    my_fields = _load_fields(me)
    scores = []
    for m in members:
        try:
            m_fields = _load_fields(m)
        except Exception:
            continue
        scores.append(res.resonance_score(my_fields, m_fields)["resonance_index"])

    if not scores:
        return {"pod_id": pod_id, "user_id": user_id, "fit": None, "member_count": len(members),
                "note": "Members haven't completed their charts yet."}

    avg_fit = round(sum(scores) / len(scores), 4)
    return {"pod_id": pod_id, "user_id": user_id, "fit": avg_fit, "member_count": len(members)}


@app.get("/api/network/graph")
async def network_graph():
    """Real network graph: every user, edges weighted by real resonance score."""
    conn = get_db()
    rows = conn.execute("SELECT * FROM profiles WHERE field_state != '{}'").fetchall()
    conn.close()

    nodes = []
    field_map = {}
    for r in rows:
        nodes.append({"id": r["user_id"], "name": r["display_name"]})
        field_map[r["user_id"]] = _load_fields(r)

    edges = []
    ids = list(field_map.keys())
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            score = res.resonance_score(field_map[ids[i]], field_map[ids[j]])
            if score["resonance_index"] > 0.55:
                edges.append({
                    "source": ids[i], "target": ids[j],
                    "weight": score["resonance_index"],
                })

    return {"nodes": nodes, "edges": edges}


# ---------------------------------------------------------------------------
# Resonance Market -- Energy Exchange economy
# ---------------------------------------------------------------------------

class ListEnergyRequest(BaseModel):
    seller_id: str
    center: str
    dimension: str = "D3"
    energy_type: str
    description: str
    price: float
    availability: str = "immediate"
    klein_tool_tuned: bool = False


class RequestEnergyRequest(BaseModel):
    buyer_id: str
    center: str
    dimension: str = "D3"
    energy_type: str
    description: str
    max_price: float
    urgency: str = "medium"
    preferred_sellers: List[str] = []


class ExecuteTransactionRequest(BaseModel):
    listing_id: str
    request_id: str
    broker_id: str = "platform"


class SubscribeRequest(BaseModel):
    user_id: str
    tool_name: str
    tier: str  # "basic" | "deep" | "mastery"


class AddCreditsRequest(BaseModel):
    user_id: str
    amount: float


def _user_bodygraph_context(user_id: str, conn: sqlite3.Connection):
    """Pull the pieces the market needs to validate a listing/request against
    a user's REAL chart: which centers are defined, which gates are active,
    and how many channels are defined (for resonance-depth scoring)."""
    row = conn.execute("SELECT natal_report FROM profiles WHERE user_id = ?", (user_id,)).fetchone()
    if not row or not row["natal_report"]:
        raise HTTPException(status_code=404, detail="Profile or natal chart not found")
    report = json.loads(row["natal_report"])
    bodygraph = report["bodygraph"]
    return {
        "centers": bodygraph["centers"],
        "active_gates": bodygraph["active_gates"],
        "gate_to_center": hd.GATE_TO_CENTER,
        "defined_channel_count": len(bodygraph["defined_channels"]),
    }


@app.post("/api/market/list")
async def market_list_energy(payload: ListEnergyRequest):
    conn = get_db()
    try:
        ctx = _user_bodygraph_context(payload.seller_id, conn)
        profile = conn.execute("SELECT display_name FROM profiles WHERE user_id = ?", (payload.seller_id,)).fetchone()
        m = market.ResonanceMarket(conn)
        listing = m.list_energy(
            seller_id=payload.seller_id, seller_name=profile["display_name"],
            centers=ctx["centers"], active_gates=ctx["active_gates"],
            gate_to_center=ctx["gate_to_center"], defined_channel_count=ctx["defined_channel_count"],
            center=payload.center, dimension=payload.dimension, energy_type=payload.energy_type,
            description=payload.description, price=payload.price, availability=payload.availability,
            klein_tool_tuned=payload.klein_tool_tuned,
        )
        return asdict_listing(listing)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


@app.post("/api/market/request")
async def market_request_energy(payload: RequestEnergyRequest):
    conn = get_db()
    try:
        ctx = _user_bodygraph_context(payload.buyer_id, conn)
        profile = conn.execute("SELECT display_name FROM profiles WHERE user_id = ?", (payload.buyer_id,)).fetchone()
        m = market.ResonanceMarket(conn)
        req = m.request_energy(
            buyer_id=payload.buyer_id, buyer_name=profile["display_name"], centers=ctx["centers"],
            center=payload.center, dimension=payload.dimension, energy_type=payload.energy_type,
            description=payload.description, max_price=payload.max_price, urgency=payload.urgency,
            preferred_sellers=payload.preferred_sellers,
        )
        return asdict_request(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


@app.get("/api/market/matches/{request_id}")
async def market_find_matches(request_id: str):
    conn = get_db()
    try:
        m = market.ResonanceMarket(conn)
        return {"matches": m.find_matches(request_id)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    finally:
        conn.close()


@app.post("/api/market/transact")
async def market_execute_transaction(payload: ExecuteTransactionRequest):
    conn = get_db()
    try:
        m = market.ResonanceMarket(conn)
        tx = m.execute_transaction(payload.listing_id, payload.request_id, payload.broker_id)
        return asdict_transaction(tx)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


@app.post("/api/market/subscribe")
async def market_subscribe(payload: SubscribeRequest):
    conn = get_db()
    try:
        m = market.ResonanceMarket(conn)
        return m.subscribe_to_tuning(payload.user_id, payload.tool_name, payload.tier)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


@app.post("/api/market/credits/add")
async def market_add_credits(payload: AddCreditsRequest):
    conn = get_db()
    m = market.ResonanceMarket(conn)
    new_balance = m.add_credits(payload.user_id, payload.amount)
    conn.close()
    return {"user_id": payload.user_id, "balance": new_balance}


@app.get("/api/market/credits/{user_id}")
async def market_get_credits(user_id: str):
    conn = get_db()
    m = market.ResonanceMarket(conn)
    balance = m.get_balance(user_id)
    conn.close()
    return {"user_id": user_id, "balance": balance}


@app.get("/api/market/stats")
async def market_stats():
    conn = get_db()
    m = market.ResonanceMarket(conn)
    stats = m.get_market_stats()
    conn.close()
    return stats


@app.get("/api/market/center/{center}")
async def market_listings_for_center(center: str):
    conn = get_db()
    m = market.ResonanceMarket(conn)
    listings = m.get_listings_for_center(center)
    conn.close()
    return {"listings": listings}


@app.get("/api/market/history/{user_id}")
async def market_user_history(user_id: str):
    conn = get_db()
    m = market.ResonanceMarket(conn)
    history = m.get_user_history(user_id)
    conn.close()
    return {"transactions": history}


def asdict_listing(l: "market.EnergyListing") -> Dict:
    d = l.__dict__.copy()
    return d


def asdict_request(r: "market.EnergyRequest") -> Dict:
    return r.__dict__.copy()


def asdict_transaction(t: "market.Transaction") -> Dict:
    return t.__dict__.copy()


# ---------------------------------------------------------------------------
# Mission Advisor -- daily mission briefs
# ---------------------------------------------------------------------------

import mission_advisor as rma
from dataclasses import asdict as _dc_asdict


@app.get("/api/mission/today/{user_id}")
async def mission_today(user_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,)).fetchone()
    conn.close()
    if not row or not row["field_state"] or row["field_state"] == "{}":
        raise HTTPException(status_code=404, detail="Profile or field state not found")

    fields = _load_fields(row)
    coherence = res.network_coherence(fields)
    brief = rma.generate_mission(user_id, fields, coherence)
    return _dc_asdict(brief)


# ---------------------------------------------------------------------------
# AUTOLING -- real rule-based text analysis for check-in notes
# ---------------------------------------------------------------------------

import autoling as al


class AnalyzeTextRequest(BaseModel):
    text: str


@app.post("/api/autoling/analyze")
async def autoling_analyze(payload: AnalyzeTextRequest):
    result = al.analyze(payload.text)
    return {
        "intent": result.intent,
        "word_count": result.word_count,
        "suggested_tags": [
            {"tag": s.tag, "score": s.score, "matched_words": s.matched_words}
            for s in result.suggested_tags
        ],
    }
