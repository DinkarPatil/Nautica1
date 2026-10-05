from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from ...db import get_db
from ...deps import current_user
from ...domains.auth.schemas import UserOut
from .brief import generate_brief
from .chat import answer as chat_answer
from .copilot import run_copilot
from .live import compute_live_snapshot
from .readiness import compute_readiness
from .report import assemble_report, insight_text
from .scorecard import build_scorecard
from .schemas import (
    AIBrief,
    CauseAttribution,
    CopilotIn,
    CopilotOut,
    ETASnapshot,
    Milestone,
    PreviewBriefIn,
    PreviewBriefOut,
    ReadinessIn,
    ReadinessOut,
    ScorecardOut,
    ShipLookupOut,
    StateTransitionOut,
    StorylineOut,
    TriageOut,
    VoyageAlertAck,
    VoyageAlertOut,
    VoyageAlertResolve,
    VoyageChatIn,
    VoyageChatOut,
    VoyageCreatedOut,
    VoyageDraftIn,
    VoyageEventOut,
    VoyageInsightOut,
    VoyageLiveSnapshot,
    VoyageOut,
    VoyageReport,
    VoyageStartOut,
    VoyageSummary,
)
from .service import (
    ack_alert,
    create_voyage,
    get_or_refresh_live,
    get_voyage,
    get_voyage_out,
    list_alerts,
    list_eta_series,
    list_events,
    list_milestones,
    list_voyages,
    lookup_ship,
    preview_brief,
    resolve_alert,
    start_voyage,
)
from .state_machine import transitions_for
from .storyline import build_storyline
from .triage import build_triage
from .attribution import compute_attribution
from .stream import voyage_stream

router = APIRouter(prefix="/api", tags=["voyage"])


# ---- voyage list/create ----


@router.get("/voyages", response_model=list[VoyageSummary])
async def voyages(
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[VoyageSummary]:
    return await list_voyages(db)


@router.post("/voyages", response_model=VoyageCreatedOut, status_code=201)
async def voyages_create(
    payload: VoyageDraftIn,
    user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> VoyageCreatedOut:
    vid = await create_voyage(db, draft=payload, actor_id=user.id)
    return VoyageCreatedOut(id=vid)


@router.post("/voyages/preview-brief", response_model=PreviewBriefOut)
async def voyages_preview_brief(
    payload: PreviewBriefIn,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> PreviewBriefOut:
    return await preview_brief(db, payload)


@router.post("/voyages/readiness", response_model=ReadinessOut)
async def voyages_readiness(
    payload: ReadinessIn,
    _user: UserOut = Depends(current_user),
) -> ReadinessOut:
    return compute_readiness(payload)


@router.post("/voyages/copilot", response_model=CopilotOut)
async def voyages_copilot(
    payload: CopilotIn,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> CopilotOut:
    return await run_copilot(db, payload)


# ---- voyage detail ----


@router.get("/voyages/{vid}", response_model=VoyageOut)
async def voyage_detail(
    vid: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> VoyageOut:
    return await get_voyage_out(db, vid)


@router.get("/voyages/{vid}/live", response_model=VoyageLiveSnapshot)
async def voyage_live(
    vid: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> VoyageLiveSnapshot:
    return await get_or_refresh_live(db, vid)


@router.get("/voyages/{vid}/events", response_model=list[VoyageEventOut])
async def voyage_events(
    vid: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[VoyageEventOut]:
    return await list_events(db, vid)


@router.get("/voyages/{vid}/alerts", response_model=list[VoyageAlertOut])
async def voyage_alerts(
    vid: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[VoyageAlertOut]:
    return await list_alerts(db, vid)


@router.post("/voyages/{vid}/alerts/{aid}/acknowledge", response_model=VoyageAlertAck)
async def voyage_ack_alert(
    vid: str,
    aid: str,
    user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> VoyageAlertAck:
    return await ack_alert(db, voyage_id=vid, alert_id=aid, actor_id=user.id)


@router.post("/voyages/{vid}/alerts/{aid}/resolve", response_model=VoyageAlertResolve)
async def voyage_resolve_alert(
    vid: str,
    aid: str,
    user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> VoyageAlertResolve:
    return await resolve_alert(db, voyage_id=vid, alert_id=aid, actor_id=user.id)


@router.get("/voyages/{vid}/alerts/triage", response_model=TriageOut)
async def voyage_alert_triage(
    vid: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> TriageOut:
    voyage = await get_voyage(db, vid)
    return await build_triage(db, voyage)


@router.get("/voyages/{vid}/brief", response_model=AIBrief)
async def voyage_brief(
    vid: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> AIBrief:
    voyage = await get_voyage(db, vid)
    live = await get_or_refresh_live(db, vid)
    return await generate_brief(db, voyage, live)


@router.post("/voyages/{vid}/brief/refresh", response_model=AIBrief)
async def voyage_brief_refresh(
    vid: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> AIBrief:
    voyage = await get_voyage(db, vid)
    live = await get_or_refresh_live(db, vid)
    return await generate_brief(db, voyage, live)


@router.get("/voyages/{vid}/eta-series", response_model=list[ETASnapshot])
async def voyage_eta_series(
    vid: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ETASnapshot]:
    return await list_eta_series(db, vid)


@router.get("/voyages/{vid}/attribution", response_model=CauseAttribution)
async def voyage_attribution(
    vid: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> CauseAttribution:
    voyage = await get_voyage(db, vid)
    return await compute_attribution(db, voyage)


@router.get("/voyages/{vid}/milestones", response_model=list[Milestone])
async def voyage_milestones(
    vid: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Milestone]:
    return await list_milestones(db, vid)


@router.get("/voyages/{vid}/insight", response_model=VoyageInsightOut)
async def voyage_insight(
    vid: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> VoyageInsightOut:
    voyage = await get_voyage(db, vid)
    out = await insight_text(db, voyage)
    return VoyageInsightOut(insight=out["insight"], _meta=out.get("_meta"))


@router.get("/voyages/{vid}/report", response_model=VoyageReport)
async def voyage_report(
    vid: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> VoyageReport:
    voyage = await get_voyage(db, vid)
    return await assemble_report(db, voyage)


@router.get("/voyages/{vid}/scorecard", response_model=ScorecardOut)
async def voyage_scorecard(
    vid: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> ScorecardOut:
    voyage = await get_voyage(db, vid)
    return await build_scorecard(db, voyage)


@router.get("/voyages/{vid}/storyline", response_model=StorylineOut)
async def voyage_storyline(
    vid: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> StorylineOut:
    voyage = await get_voyage(db, vid)
    return await build_storyline(db, voyage)


@router.post("/voyages/{vid}/start", response_model=VoyageStartOut)
async def voyage_start(
    vid: str,
    user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> VoyageStartOut:
    voyage, t = await start_voyage(db, voyage_id=vid, actor_id=user.id)
    return VoyageStartOut(
        id=voyage.id,
        state=voyage.status,  # type: ignore[arg-type]
        transition=StateTransitionOut(
            voyageId=voyage.id,
            fromState=t.from_state,
            toState=t.to_state,  # type: ignore[arg-type]
            ts=t.ts.isoformat() if t.ts else "",
            actor=t.actor,
            note=t.note,
        ),
    )


@router.get("/voyages/{vid}/transitions", response_model=list[StateTransitionOut])
async def voyage_transitions(
    vid: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[StateTransitionOut]:
    rows = await transitions_for(db, vid)
    return [
        StateTransitionOut(
            voyageId=r.voyage_id,
            fromState=r.from_state,
            toState=r.to_state,  # type: ignore[arg-type]
            ts=r.ts.isoformat() if r.ts else "",
            actor=r.actor,
            note=r.note,
        )
        for r in rows
    ]


@router.post("/voyages/{vid}/chat", response_model=VoyageChatOut)
async def voyage_chat(
    vid: str,
    payload: VoyageChatIn,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> VoyageChatOut:
    voyage = await get_voyage(db, vid)
    return await chat_answer(db, voyage, payload.message)


@router.get("/voyages/{vid}/stream")
async def voyage_stream_route(
    vid: str,
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> EventSourceResponse:
    return EventSourceResponse(voyage_stream(db, vid))


# ---- ships ----


@router.get("/ships/lookup", response_model=ShipLookupOut)
async def ship_lookup(
    imo: str = Query(min_length=3),
    _user: UserOut = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> ShipLookupOut:
    out = await lookup_ship(db, imo)
    return ShipLookupOut(matched=out["matched"], ship=out.get("ship"))
