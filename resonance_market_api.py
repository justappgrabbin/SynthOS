"""
Resonance Market API — HTTP surface for resonance_market.py.

Why this file exists: ResonanceMarket lives in Python (non-motor). LivingOrganism.ts
lives in JS (motor). A motor agent shouldn't directly import a non-motor module --
that breaks the same embodiment rule the rest of the system is built on. So instead
of a direct import, the JS side reaches this market through the MCP-HUB bus, which
calls these endpoints.

ASSUMPTION (flagging, not guessing silently): this expects a shared SQLite file at
the path already used by main.py's stored natal_report data, so market state lives
in the same DB main.py already reads/writes. If main.py's DB path differs, update
DB_PATH below to match -- everything else stays the same.
"""

from __future__ import annotations
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import sqlite3

from resonance_market import ResonanceMarket

DB_PATH = "synthia.db"  # ASSUMPTION -- point this at main.py's real sqlite file

app = FastAPI(title="Resonance Market API")


def get_market() -> ResonanceMarket:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return ResonanceMarket(conn)


# ── Request/response models (mirror the TS EnergyListing/EnergyRequest shape) ──

class ListEnergyRequest(BaseModel):
    seller_id: str
    seller_name: str
    centers: Dict[str, str]
    active_gates: List[int]
    gate_to_center: Dict[int, str]  # keys arrive as strings over JSON; cast below
    defined_channel_count: int
    center: str
    dimension: str
    energy_type: str
    description: str
    price: float
    availability: str
    klein_tool_tuned: bool = False


class RequestEnergyRequest(BaseModel):
    buyer_id: str
    buyer_name: str
    centers: Dict[str, str]
    center: str
    dimension: str
    energy_type: str
    description: str
    max_price: float
    urgency: str
    preferred_sellers: Optional[List[str]] = None


class ExecuteTransactionRequest(BaseModel):
    listing_id: str
    request_id: str
    broker_id: str


class AddCreditsRequest(BaseModel):
    user_id: str
    amount: float


# ── Endpoints — one per ResonanceMarket method, same names JS already expects ──

@app.post("/market/list-energy")
def list_energy(body: ListEnergyRequest):
    market = get_market()
    try:
        gate_to_center = {int(k): v for k, v in body.gate_to_center.items()}
        listing = market.list_energy(
            body.seller_id, body.seller_name, body.centers,
            body.active_gates, gate_to_center, body.defined_channel_count,
            body.center, body.dimension, body.energy_type, body.description,
            body.price, body.availability, body.klein_tool_tuned,
        )
        return listing
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/market/request-energy")
def request_energy(body: RequestEnergyRequest):
    market = get_market()
    try:
        req = market.request_energy(
            body.buyer_id, body.buyer_name, body.centers, body.center,
            body.dimension, body.energy_type, body.description,
            body.max_price, body.urgency, body.preferred_sellers,
        )
        return req
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/market/find-matches/{request_id}")
def find_matches(request_id: str):
    market = get_market()
    try:
        return market.find_matches(request_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/market/execute-transaction")
def execute_transaction(body: ExecuteTransactionRequest):
    market = get_market()
    try:
        return market.execute_transaction(body.listing_id, body.request_id, body.broker_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/market/add-credits")
def add_credits(body: AddCreditsRequest):
    market = get_market()
    new_balance = market.add_credits(body.user_id, body.amount)
    return {"balance": new_balance}


@app.get("/market/balance/{user_id}")
def get_balance(user_id: str):
    market = get_market()
    return {"balance": market.get_balance(user_id)}


@app.get("/market/stats")
def get_market_stats():
    market = get_market()
    return market.get_market_stats()


@app.get("/market/listings/{center}")
def get_listings_for_center(center: str):
    market = get_market()
    return market.get_listings_for_center(center)
