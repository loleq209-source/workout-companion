/**
 * Modals controller: RPE Bottom Sheet, Rich 3-Step Guide & Frame Player Modal, and Custom Exercise Modal.
 */
import { ENRICHED_DB, getGuideMedia, isWarmupOrStretch } from "../data.mjs";
import { getTodayStr } from "../date.mjs";

export function createModalController({ store, sync, onRenderAll, showToast }) {
  let pendingRpeExerciseId = null;
  let guidePlayTimer = null;
  let guideViewMode = "full"; // "full" | "frame"
  let guideFrameIdx = 0; // 0 | 1 | 2
  let guidePlaying = false;
  let activeGuideEx = null;

  function stopGuideAutoPlay() {
    if (guidePlayTimer) {
      clearInterval(guidePlayTimer);
      guidePlayTimer = null;
    }
    guidePlaying = false;
  }

  function closeGuideModal() {
    stopGuideAutoPlay();
    activeGuideEx = null;
    const modal = document.getElementById("zoomModal");
    if (modal) modal.classList.add("hidden");
  }

  function renderGuideModalBody() {
    const ex = activeGuideEx;
    const body = document.getElementById("zoomModalBody");
    const titleEl = document.getElementById("zoomModalTitle");
    if (!ex || !body) return;

    const enriched = ENRICHED_DB[ex.id] || null;
    const media = getGuideMedia(ex.id);
    const rec = store.getRecord(ex);
    const lastRec = store.getLastRecord(ex.id, ex.name);
    const phases = enriched && Array.isArray(enriched.phases) ? enriched.phases : [];
    const activePhase = phases[guideFrameIdx] || null;

    if (titleEl) {
      titleEl.textContent = `${ex.name}`;
    }

    const currentImgSrc = media
      ? guideViewMode === "full"
        ? media.full
        : media.frames[guideFrameIdx] || media.full
      : null;

    const pref = rec.preference;

    body.innerHTML = `
      ${
        currentImgSrc
          ? `
        <div style="background:#000; border:1px solid var(--border); border-radius:14px; overflow:hidden;">
          <div style="position:relative; width:100%; aspect-ratio:16/9; display:flex; align-items:center; justify-content:center;">
            <img src="${currentImgSrc}" alt="${ex.name}" style="width:100%; height:100%; object-fit:contain; display:block;">
            <span style="position:absolute; top:8px; left:8px; background:rgba(0,0,0,0.78); color:var(--accent); border:1px solid rgba(163,230,53,0.35); border-radius:8px; padding:2px 8px; font-size:10.5px; font-weight:800;">
              ${guideViewMode === "full" ? "전체 3컷 보기" : `${guideFrameIdx + 1}단계${activePhase ? ` · ${activePhase.title}` : ""}`}
            </span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(4, 1fr) auto; gap:5px; padding:8px; background:var(--card-2); border-top:1px solid var(--border);">
            <button type="button" data-gm-action="view-full" class="btn-tap ${guideViewMode === "full" ? "badge-lime" : "badge-muted"}" style="height:30px; border-radius:8px; font-size:11px; justify-content:center;">전체컷</button>
            <button type="button" data-gm-action="view-frame" data-step="0" class="btn-tap ${guideViewMode === "frame" && guideFrameIdx === 0 ? "badge-lime" : "badge-muted"}" style="height:30px; border-radius:8px; font-size:11px; justify-content:center;">1단계</button>
            <button type="button" data-gm-action="view-frame" data-step="1" class="btn-tap ${guideViewMode === "frame" && guideFrameIdx === 1 ? "badge-lime" : "badge-muted"}" style="height:30px; border-radius:8px; font-size:11px; justify-content:center;">2단계</button>
            <button type="button" data-gm-action="view-frame" data-step="2" class="btn-tap ${guideViewMode === "frame" && guideFrameIdx === 2 ? "badge-lime" : "badge-muted"}" style="height:30px; border-radius:8px; font-size:11px; justify-content:center;">3단계</button>
            <button type="button" data-gm-action="toggle-play" class="btn-tap ${guidePlaying ? "badge-amber" : "badge-muted"}" style="height:30px; padding:0 10px; border-radius:8px; font-size:11px;">${guidePlaying ? "⏸" : "▶"}</button>
          </div>
        </div>
      `
          : ""
      }

      <div class="row-between" style="flex-wrap:wrap; gap:6px;">
        <div class="row-gap" style="flex-wrap:wrap; gap:5px;">
          <span class="badge badge-muted">${ex.equipment || "맨몸/소도구"}</span>
          <span class="badge badge-lime">${ex.targetMuscle || "전신"}</span>
          ${lastRec ? `<span class="badge badge-purple">최근 ${lastRec.date.slice(5)} · RPE ${lastRec.data.rpe ?? "-"}</span>` : ""}
        </div>
        <div class="row-gap" style="gap:4px;">
          <button type="button" data-gm-action="set-pref" data-pref="like" class="btn-tap badge ${pref === "like" ? "badge-lime" : "badge-muted"}" style="padding:4px 8px;">⭐ 선호</button>
          <button type="button" data-gm-action="set-pref" data-pref="dislike" class="btn-tap badge ${pref === "dislike" ? "badge-rose" : "badge-muted"}" style="padding:4px 8px;">⚠️ 비선호</button>
        </div>
      </div>

      ${
        phases.length > 0
          ? `
        <div style="background:var(--card-2); border:1px solid var(--border); border-radius:12px; padding:10px;" class="stack-2">
          ${phases
            .map(
              (p, i) => `
            <div style="font-size:12px; line-height:1.45; color:var(--text-soft); padding:4px 6px; border-radius:8px; ${guideViewMode === "frame" && guideFrameIdx === i ? "background:rgba(163,230,53,0.08); border:1px solid rgba(163,230,53,0.28);" : ""}">
              <strong style="color:${guideViewMode === "frame" && guideFrameIdx === i ? "var(--accent)" : "#fff"};">${p.step || i + 1}. [${p.title}]</strong>
              <span>${p.cue}</span>
              ${p.breath ? `<div style="font-size:10.5px; color:var(--text-muted); margin-top:2px;">💨 ${p.breath} · ⏱ ${p.tempo || ""}</div>` : ""}
            </div>
          `
            )
            .join("")}
        </div>
      `
          : `
        <div style="background:var(--card-2); border:1px solid var(--border); border-radius:12px; padding:10px; font-size:12px; color:var(--text-soft); line-height:1.5;" class="stack-1">
          <div><strong style="color:#fff;">준비:</strong> ${ex.prep || "올바른 자세를 잡습니다."}</div>
          ${(ex.steps || []).map((st, i) => `<div><strong>${i + 1}.</strong> ${st}</div>`).join("")}
        </div>
      `
      }

      ${
        ex.tips || (enriched && enriched.doCue)
          ? `
        <div style="background:var(--card-2); border:1px solid var(--border); border-radius:12px; padding:9px 10px; font-size:11.5px; line-height:1.45;" class="stack-1">
          ${enriched && enriched.doCue ? `<div><strong style="color:var(--accent);">⭕ 핵심:</strong> <span style="color:var(--text-soft);">${enriched.doCue}</span></div>` : ""}
          ${enriched && enriched.dontCue ? `<div><strong style="color:var(--rose);">❌ 주의:</strong> <span style="color:var(--text-soft);">${enriched.dontCue}</span></div>` : ""}
          ${ex.tips ? `<div style="color:var(--text-muted); margin-top:2px;">💡 ${ex.tips}</div>` : ""}
        </div>
      `
          : ""
      }

      <button type="button" data-gm-action="jump-today" class="btn-tap btn-primary" style="height:40px; font-size:13px;">
        🎯 오늘 미션으로 이동 / 추가
      </button>
    `;

    body.querySelectorAll("[data-gm-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        const act = btn.dataset.gmAction;
        if (act === "view-full") {
          stopGuideAutoPlay();
          guideViewMode = "full";
          renderGuideModalBody();
        } else if (act === "view-frame") {
          stopGuideAutoPlay();
          guideViewMode = "frame";
          guideFrameIdx = Number(btn.dataset.step) || 0;
          renderGuideModalBody();
        } else if (act === "toggle-play") {
          if (guidePlaying) {
            stopGuideAutoPlay();
            renderGuideModalBody();
          } else {
            guideViewMode = "frame";
            guidePlaying = true;
            renderGuideModalBody();
            guidePlayTimer = setInterval(() => {
              if (!activeGuideEx) {
                stopGuideAutoPlay();
                return;
              }
              guideFrameIdx = (guideFrameIdx + 1) % 3;
              renderGuideModalBody();
            }, 1400);
          }
        } else if (act === "set-pref") {
          const val = btn.dataset.pref;
          rec.preference = rec.preference === val ? null : val;
          store.persistState();
          sync.scheduleAutoPush(600);
          renderGuideModalBody();
          onRenderAll();
        } else if (act === "jump-today") {
          const targetIdx = store.addExerciseToTodayRoutine(ex.id);
          closeGuideModal();
          if (targetIdx >= 0) {
            store.state.activeTab = "today";
            store.state.todayScreen = "card";
            store.state.todayCardIndex = targetIdx;
            store.persistState();
            sync.scheduleAutoPush(600);
            onRenderAll();
            showToast(`🎯 [${ex.name}] 카드로 이동합니다.`);
          }
        }
      });
    });
  }

  function openExerciseGuideModal(ex, initialMode = "full") {
    if (!ex) return;
    stopGuideAutoPlay();
    activeGuideEx = ex;
    guideViewMode = initialMode;
    guideFrameIdx = 0;
    const modal = document.getElementById("zoomModal");
    if (modal) modal.classList.remove("hidden");
    renderGuideModalBody();
  }

  function directFinishExercise(ex, rec) {
    store.markUserInteractedToday();
    rec.isCompleted = true;
    rec.lastUpdatedDate = getTodayStr();
    if (Array.isArray(rec.sets)) {
      rec.sets.forEach(s => { s.done = true; });
    }
    store.persistState();
    sync.scheduleAutoPush(300);
    showToast(`✅ ${ex.name} 완료!`);
    moveToNextIncompleteExercise();
  }

  function moveToNextIncompleteExercise() {
    const state = store.state;
    const items = store.getTodayRoutineExercises();
    const nextIdx = items.findIndex((item, i) => i > state.todayCardIndex && !store.getRecord(item).isCompleted);
    if (nextIdx !== -1) {
      state.todayCardIndex = nextIdx;
      onRenderAll();
    } else {
      const firstIncomplete = items.findIndex(item => !store.getRecord(item).isCompleted);
      if (firstIncomplete !== -1) {
        state.todayCardIndex = firstIncomplete;
        onRenderAll();
      } else {
        state.todayScreen = "dashboard";
        onRenderAll();
        showToast("🎉 오늘 추천 루틴을 모두 완료했습니다! 고생하셨습니다!");
      }
    }
  }

  function openRpeBottomSheet(ex, rec) {
    if (!ex) return;
    if (isWarmupOrStretch(ex)) {
      directFinishExercise(ex, rec);
      return;
    }
    pendingRpeExerciseId = ex.id;
    const titleEl = document.getElementById("rpeExTitle");
    if (titleEl) titleEl.textContent = `${ex.name} 완료!`;
    const sheet = document.getElementById("rpeBottomSheet");
    if (sheet) sheet.classList.remove("hidden");
  }

  function finalizeFinishWithRpe(rpe) {
    if (!pendingRpeExerciseId) return;
    const exId = pendingRpeExerciseId;
    pendingRpeExerciseId = null;
    const sheet = document.getElementById("rpeBottomSheet");
    if (sheet) sheet.classList.add("hidden");

    const allEx = store.getTodayRoutineExercises().concat(store.state.customExercises || []);
    const ex = allEx.find(x => x.id === exId) || { id: exId, name: "운동" };
    const rec = store.getRecord(ex);

    store.markUserInteractedToday();
    if (rpe !== null) rec.rpe = rpe;
    rec.isCompleted = true;
    rec.lastUpdatedDate = getTodayStr();
    if (Array.isArray(rec.sets)) {
      rec.sets.forEach(s => { s.done = true; });
    }

    store.refreshMetrics();
    store.persistState();
    sync.scheduleAutoPush(300);
    moveToNextIncompleteExercise();
  }

  function bindModalEvents() {
    document.getElementById("rpeSkipBtn")?.addEventListener("click", () => finalizeFinishWithRpe(null));
    document.querySelectorAll(".rpe-btn").forEach(btn => {
      btn.addEventListener("click", () => finalizeFinishWithRpe(Number(btn.dataset.rpe)));
    });

    document.getElementById("zoomModalCloseBtn")?.addEventListener("click", closeGuideModal);
    document.getElementById("zoomModal")?.addEventListener("click", e => {
      if (e.target.id === "zoomModal") closeGuideModal();
    });

    document.getElementById("addCustomExBtn")?.addEventListener("click", () => {
      document.getElementById("addExModal")?.classList.remove("hidden");
    });
    document.getElementById("addExModalCloseBtn")?.addEventListener("click", () => {
      document.getElementById("addExModal")?.classList.add("hidden");
    });

    document.getElementById("saveNewExBtn")?.addEventListener("click", () => {
      const name = document.getElementById("newExName").value.trim();
      if (!name) {
        showToast("운동 이름을 입력해 주세요.");
        return;
      }
      const newEx = {
        id: `custom_${Date.now()}`,
        name,
        mode: document.getElementById("newExMode").value,
        category: document.getElementById("newExCat").value,
        equipment: (document.getElementById("newExEquip")?.value || "").trim() || "맨몸/소도구",
        targetMuscle: (document.getElementById("newExTarget")?.value || "").trim() || "전신",
        defaultSets: Number(document.getElementById("newExSets").value) || 3,
        defaultReps: (document.getElementById("newExReps").value || "").trim() || "10회",
        defaultWeightKg: Number(document.getElementById("newExWeight")?.value) || 0,
        restSec: 60,
        presets: ["all", "custom"]
      };
      store.state.customExercises.push(newEx);
      store.persistState();
      sync.scheduleAutoPush(300);
      document.getElementById("addExModal")?.classList.add("hidden");
      document.getElementById("newExName").value = "";
      showToast(`✅ [${newEx.name}] 추가 완료!`);
      onRenderAll();
    });
  }

  return {
    openExerciseGuideModal,
    directFinishExercise,
    openRpeBottomSheet,
    finalizeFinishWithRpe,
    moveToNextIncompleteExercise,
    bindModalEvents
  };
}
