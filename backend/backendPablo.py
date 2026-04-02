from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import random
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Auth dependency — verifies the Supabase JWT sent by the frontend
# ─────────────────────────────────────────────────────────────────────────────
async def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Invalid authorization header")
    token = authorization[7:]
    try:
        res = supabase.auth.get_user(token)
        if not res.user:
            raise HTTPException(401, "Invalid or expired token")
        return res.user
    except Exception:
        raise HTTPException(401, "Invalid or expired token")

# Schemas
class CreateGroupRequest(BaseModel):
    name: str

class JoinGroupRequest(BaseModel):
    group_id: str

class PlaceVoteRequest(BaseModel):
    place_id: str
    group_id: str
    value: int = 1  # 1 = upvote, -1 = downvote

class CheckInRequest(BaseModel):
    place_id: str
    group_id: str
    note: Optional[str] = None

# ─────────────────────────────────────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────────────────────────────────────
def award_points(group_id: str, user_id: str, delta: int):
    res = (
        supabase.table("group_members")
        .select("points")
        .eq("group_id", group_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if res.data:
        supabase.table("group_members").update(
            {"points": res.data["points"] + delta}
        ).eq("group_id", group_id).eq("user_id", user_id).execute()

def require_membership(group_id: str, user_id: str):
    res = (
        supabase.table("group_members")
        .select("role")
        .eq("group_id", group_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(403, "Not a member of this group")
    return res.data[0]["role"]

# Group endpoints
@app.post("/groups/create")
def create_group(req: CreateGroupRequest, user=Depends(get_current_user)):
    res = supabase.table("groups").insert({
        "name": req.name,
        "created_by": user.id,
    }).execute()
    if not res.data:
        raise HTTPException(500, "Failed to create group")
    group = res.data[0]
    return {"group_id": group["id"], "name": group["name"]}

@app.post("/groups/join")
def join_group(req: JoinGroupRequest, user=Depends(get_current_user)):
    group_res = (
        supabase.table("groups")
        .select("id, name")
        .eq("id", req.group_id)
        .single()
        .execute()
    )
    if not group_res.data:
        raise HTTPException(404, "Group not found")

    existing = (
        supabase.table("group_members")
        .select("user_id")
        .eq("group_id", req.group_id)
        .eq("user_id", user.id)
        .execute()
    )
    if existing.data:
        return {"message": "Already a member", "group_id": req.group_id, "name": group_res.data["name"]}

    supabase.table("group_members").insert({
        "group_id": req.group_id,
        "user_id": user.id,
        "role": "member",
    }).execute()

    return {"message": "Joined group", "group_id": req.group_id, "name": group_res.data["name"]}

@app.get("/groups/{group_id}/dashboard")
def get_dashboard(group_id: str, user=Depends(get_current_user)):
    require_membership(group_id, user.id)

    # Members + profiles
    members_res = (
        supabase.table("group_members")
        .select("points, profiles(display_name)")
        .eq("group_id", group_id)
        .execute()
    )
    members = sorted(
        [
            {
                "name": (m.get("profiles") or {}).get("display_name") or "Unknown",
                "points": m["points"],
                "online": False,
            }
            for m in (members_res.data or [])
        ],
        key=lambda m: m["points"],
        reverse=True,
    )

    # Total check-ins for the group
    visits_res = (
        supabase.table("visits")
        .select("id", count="exact")
        .eq("group_id", group_id)
        .execute()
    )
    total_checkins = visits_res.count or 0

    # Top voted place
    votes_res = (
        supabase.table("votes")
        .select("place_id, value, places(name)")
        .eq("group_id", group_id)
        .execute()
    )
    place_scores: dict[str, int] = {}
    place_names: dict[str, str] = {}
    for vote in votes_res.data or []:
        pid = vote["place_id"]
        place_scores[pid] = place_scores.get(pid, 0) + vote["value"]
        if vote.get("places"):
            place_names[pid] = vote["places"]["name"]

    top_place_id = max(place_scores, key=place_scores.__getitem__) if place_scores else None
    top_voted = place_names.get(top_place_id, "None") if top_place_id else "None"

    return {
        "upcoming_plans": 0,
        "members_online": 0,
        "recent_checkins": total_checkins,
        "top_voted_place": top_voted,
        "members": members,
        "target": {
            "description": "Weekend challenge: 3 group check-ins.",
            "goal": 3,
            "progress": min(total_checkins, 3),
        },
    }

@app.get("/groups/{group_id}/scoreboard")
def get_scoreboard(group_id: str, user=Depends(get_current_user)):
    require_membership(group_id, user.id)

    members_res = (
        supabase.table("group_members")
        .select("points, profiles(display_name)")
        .eq("group_id", group_id)
        .order("points", desc=True)
        .execute()
    )
    return {
        "scoreboard": [
            {
                "rank": i + 1,
                "name": (m.get("profiles") or {}).get("display_name") or "Unknown",
                "points": m["points"],
            }
            for i, m in enumerate(members_res.data or [])
        ]
    }

# Places & Voting
@app.post("/places/vote")
def vote_for_place(req: PlaceVoteRequest, user=Depends(get_current_user)):
    if req.value not in (-1, 1):
        raise HTTPException(400, "value must be 1 or -1")
    require_membership(req.group_id, user.id)

    supabase.table("votes").upsert(
        {
            "group_id": req.group_id,
            "user_id": user.id,
            "place_id": req.place_id,
            "value": req.value,
        },
        on_conflict="group_id,user_id,place_id",
    ).execute()

    award_points(req.group_id, user.id, 5)

    votes_res = (
        supabase.table("votes")
        .select("value")
        .eq("group_id", req.group_id)
        .eq("place_id", req.place_id)
        .execute()
    )
    total = sum(v["value"] for v in (votes_res.data or []))
    return {"vote_total": total}

@app.post("/places/checkin")
def checkin(req: CheckInRequest, user=Depends(get_current_user)):
    require_membership(req.group_id, user.id)

    supabase.table("visits").insert({
        "user_id": user.id,
        "place_id": req.place_id,
        "group_id": req.group_id,
        "note": req.note,
    }).execute()

    # Increment cached visit count on the place
    place_res = (
        supabase.table("places")
        .select("visit_count_cache")
        .eq("id", req.place_id)
        .single()
        .execute()
    )
    if place_res.data:
        supabase.table("places").update(
            {"visit_count_cache": place_res.data["visit_count_cache"] + 1}
        ).eq("id", req.place_id).execute()

    award_points(req.group_id, user.id, 20)

    return {"message": "Checked in!"}

# ─────────────────────────────────────────────────────────────────────────────
# Discovery / Recommendation
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/discover/{group_id}")
def discover_places(group_id: str, user=Depends(get_current_user)):
    require_membership(group_id, user.id)

    # Places already visited by this group
    visited_res = (
        supabase.table("visits")
        .select("place_id")
        .eq("group_id", group_id)
        .execute()
    )
    visited_ids = {v["place_id"] for v in (visited_res.data or [])}

    # Vote scores per place for this group
    votes_res = (
        supabase.table("votes")
        .select("place_id, value")
        .eq("group_id", group_id)
        .execute()
    )
    vote_scores: dict[str, int] = {}
    for vote in votes_res.data or []:
        pid = vote["place_id"]
        vote_scores[pid] = vote_scores.get(pid, 0) + vote["value"]

    # All places with type name
    places_res = (
        supabase.table("places")
        .select("id, name, formatted_address, lat, lng, place_types(name)")
        .execute()
    )

    scored = []
    for place in places_res.data or []:
        if place["id"] in visited_ids:
            continue
        vote_score = vote_scores.get(place["id"], 0) * 2
        novelty = random.uniform(0, 1)
        place_type = (place.get("place_types") or {}).get("name", "Other")
        scored.append({
            "id": place["id"],
            "name": place["name"],
            "category": place_type,
            "formatted_address": place.get("formatted_address"),
            "lat": place["lat"],
            "lng": place["lng"],
            "score": vote_score + novelty,
        })

    scored.sort(key=lambda p: p["score"], reverse=True)
    return {"recommendations": scored[:5]}
