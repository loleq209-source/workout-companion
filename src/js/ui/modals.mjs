/**
 * Modals controller: RPE Bottom Sheet, Rich 3-Step Guide & Frame Player Modal, and Custom Exercise Modal.
 */
import { ENRICHED_DB, getGuideMedia, isWarmupOrStretch, getAllExercises, findPainAlertAlternative } from "../data.mjs";
import { getTodayStr, getWorkoutDateStr } from "../date.mjs";
import { getSwapCandidates } from "../swapEngine.mjs";
import { EXTRA_MODES, getVolumePresetsForExercise, recommendExtraExercises } from "../recommendEngine.mjs";
import { renderCompletionReportModal } from "./report.mjs";

export function createModalController({ store, sync, uiHistory = null, onRenderAll, showToast }) {
  let pendingRpeExerciseId = null;
  let guidePlayTimer = null;
  let guideViewMode = "full"; // "full" | "frame"
  let guideFrameIdx = 0; // 0 | 1 | 2
  let guidePlaying = false;
  let activeGuideEx = null;
  let swapTargetIdx = 0;
  let swapTabMode = "home";
  let swapReason = "variation";
  let swapReasonManual = false;
  let quickAddRecMode = "custom";
  let quickAddSearchQuery = "";
  let quickAddSelectedId = null;
  let quickAddSelectedReason = "맞춤 추천";
  let quickAddActivePreset = "default";

  function stopGuideAutoPlay() {
    if (guidePlayTimer) {
      clearInterval(guidePlayTimer);
      guidePlayTimer = null;
    }
    guidePlaying = false;
  }

  function closeGuideModal(fromPopState = false) {
    stopGuideAutoPlay();
    activeGuideEx = null;
    const modal = document.getElementById("zoomModal");
    const wasOpen = modal && !modal.classList.contains("hidden");
    if (modal) modal.classList.add("hidden");
    if (wasOpen && uiHistory) {
      if (fromPopState) uiHistory.clearTag("zoomModal");
      else uiHistory.pop("zoomModal");
    }
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
          store.setExercisePreference(ex.id, rec.preference === val ? null : val);
          sync.pushToGoogleDrive(true);
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
    if (modal) {
      const alreadyOpen = !modal.classList.contains("hidden");
      modal.classList.remove("hidden");
      if (!alreadyOpen && uiHistory) uiHistory.push("zoomModal");
    }
    renderGuideModalBody();
  }

  function directFinishExercise(ex, rec) {
    store.markUserInteractedToday();
    rec.isCompleted = true;
    rec.lastUpdatedDate = getTodayStr();
    if (Array.isArray(rec.sets)) {
      rec.sets.forEach(s => { s.done = true; });
    }
    if (sync && typeof sync.commitTodayHistory === "function") {
      sync.commitTodayHistory();
    } else {
      store.refreshMetrics();
      store.persistState();
    }
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
        if (uiHistory && state.todayScreen === "card") {
          uiHistory.replace("card", "reportModal");
        }
        state.todayScreen = "dashboard";
        onRenderAll();
        showToast("🎉 오늘 추천 루틴을 모두 완료했습니다! 고생하셨습니다!");
        openCompletionReportModal();
      }
    }
  }

  function openCompletionReportModal() {
    renderCompletionReportModal(store);
    const modal = document.getElementById("reportModal");
    if (modal) {
      const alreadyOpen = !modal.classList.contains("hidden");
      modal.classList.remove("hidden");
      if (!alreadyOpen && uiHistory) uiHistory.push("reportModal");
    }
  }

  function closeCompletionReportModal(fromPopState = false) {
    const modal = document.getElementById("reportModal");
    const wasOpen = modal && !modal.classList.contains("hidden");
    if (modal) modal.classList.add("hidden");
    if (wasOpen && uiHistory) {
      if (fromPopState) uiHistory.clearTag("reportModal");
      else uiHistory.pop("reportModal");
    }
  }

  function getAllDislikedIds() {
    const set = new Set(Array.isArray(store.state.dislikedExercises) ? store.state.dislikedExercises : []);
    if (store.state.records) {
      for (const [eid, rec] of Object.entries(store.state.records)) {
        if (rec && rec.preference === "dislike") set.add(eid);
      }
    }
    return [...set];
  }

  function renderQuickAddPresetChips(ex) {
    const wrap = document.getElementById("quickAddPresetChips");
    if (!wrap || !ex) return;
    const presets = getVolumePresetsForExercise(ex);
    wrap.innerHTML = presets
      .map(
        p => `
          <button type="button" class="btn-tap quick-preset-chip ${quickAddActivePreset === p.id ? "active" : ""}" data-vol-preset="${p.id}">
            ${p.label}
          </button>
        `
      )
      .join("");

    wrap.querySelectorAll("[data-vol-preset]").forEach(btn => {
      btn.addEventListener("click", () => {
        const picked = presets.find(x => x.id === btn.dataset.volPreset);
        if (!picked) return;
        quickAddActivePreset = picked.id;
        const setsEl = document.getElementById("quickAddSets");
        const repsEl = document.getElementById("quickAddReps");
        const weightEl = document.getElementById("quickAddWeight");
        if (setsEl) setsEl.value = String(picked.sets);
        if (repsEl) repsEl.value = String(picked.reps);
        if (weightEl) weightEl.value = String(picked.weightKg);
        wrap.querySelectorAll("[data-vol-preset]").forEach(b => {
          b.classList.toggle("active", b.dataset.volPreset === picked.id);
        });
      });
    });
  }

  function syncQuickAddDefaults(exId, reasonLabel = null) {
    const allEx = getAllExercises(store.state.customExercises);
    const ex = allEx.find(x => x.id === exId) || allEx[0];
    if (!ex) return;
    quickAddSelectedId = ex.id;
    if (reasonLabel) quickAddSelectedReason = reasonLabel;
    quickAddActivePreset = "default";

    const setsEl = document.getElementById("quickAddSets");
    const repsEl = document.getElementById("quickAddReps");
    const weightEl = document.getElementById("quickAddWeight");
    const selEl = document.getElementById("quickAddExSelect");
    const nameEl = document.getElementById("quickAddSelectedName");
    const metaEl = document.getElementById("quickAddSelectedMeta");

    if (setsEl) setsEl.value = String(ex.defaultSets || 3);
    if (repsEl) repsEl.value = String(ex.defaultReps || "10회");
    if (weightEl) weightEl.value = String(typeof ex.defaultWeightKg === "number" ? ex.defaultWeightKg : 0);
    if (selEl && [...selEl.options].some(o => o.value === ex.id)) selEl.value = ex.id;
    if (nameEl) nameEl.textContent = ex.name;
    if (metaEl) metaEl.textContent = quickAddSelectedReason || "추가 선택";

    renderQuickAddPresetChips(ex);
    document.querySelectorAll("#quickAddRecList [data-rec-pick]").forEach(card => {
      card.classList.toggle("is-selected", card.dataset.recPick === ex.id);
    });
  }

  function renderQuickAddCatalogOptions() {
    const sel = document.getElementById("quickAddExSelect");
    const countEl = document.getElementById("quickAddSearchCount");
    if (!sel) return [];

    const allEx = getAllExercises(store.state.customExercises);
    const dislikedSet = new Set(getAllDislikedIds());
    const q = (quickAddSearchQuery || "").trim().toLowerCase();

    let filtered = allEx;
    if (q) {
      filtered = allEx.filter(
        ex =>
          (ex.name || "").toLowerCase().includes(q) ||
          (ex.targetMuscle || "").toLowerCase().includes(q) ||
          (ex.equipment || "").toLowerCase().includes(q) ||
          (ex.category || "").toLowerCase().includes(q)
      );
    }

    const sortedEx = filtered.slice().sort((a, b) => Number(dislikedSet.has(a.id)) - Number(dislikedSet.has(b.id)));
    if (countEl) {
      countEl.textContent = q ? `검색 ${sortedEx.length}/${allEx.length}종` : `전체 ${allEx.length}종`;
    }

    if (!sortedEx.length) {
      sel.innerHTML = `<option value="">검색 결과 없음</option>`;
      return [];
    }

    sel.innerHTML = sortedEx
      .map(ex => {
        const tag = ex.mode === "gym" ? "기구" : String(ex.id).startsWith("custom_") ? "내종목" : "홈트";
        const dislikeTag = dislikedSet.has(ex.id) ? " · 👎 비선호" : "";
        return `<option value="${ex.id}">[${tag}] ${ex.name} (${ex.targetMuscle})${dislikeTag}</option>`;
      })
      .join("");

    if (quickAddSelectedId && sortedEx.some(x => x.id === quickAddSelectedId)) {
      sel.value = quickAddSelectedId;
    } else if (sortedEx[0]) {
      sel.value = sortedEx[0].id;
    }
    return sortedEx;
  }

  function renderQuickAddSheet(autoPickTopRec = false) {
    // 1. Update 4 purpose chips
    document.querySelectorAll("#quickAddModeChips [data-rec-mode]").forEach(btn => {
      btn.classList.toggle("active-ok", btn.dataset.recMode === quickAddRecMode);
    });

    const painAreas =
      store.state.bodyCondition && Array.isArray(store.state.bodyCondition.painAreas)
        ? store.state.bodyCondition.painAreas
        : [];
    const disliked = getAllDislikedIds();
    const routineItems = store.getTodayRoutineExercises();
    const metrics = store.refreshMetrics();
    const routineMode = store.getRoutineEffectiveMode ? store.getRoutineEffectiveMode() : "home";

    const statusBanner = document.getElementById("quickAddFilterStatus");
    if (statusBanner) {
      const notes = [];
      if (painAreas.length > 0) notes.push(`🩺 [${painAreas.join("·")}] 부담 종목 제외`);
      if (disliked.length > 0) notes.push(`👎 비선호 ${disliked.length}종 제외`);
      if (notes.length > 0) {
        statusBanner.textContent = `자동 안전 필터링 적용 중: ${notes.join(" · ")}`;
        statusBanner.classList.remove("hidden");
      } else {
        statusBanner.classList.add("hidden");
      }
    }

    const recs = recommendExtraExercises({
      mode: quickAddRecMode,
      routineItems,
      records: store.state.records,
      metrics,
      painAreas,
      dislikedExercises: disliked,
      customExercises: store.state.customExercises,
      routineMode,
      limit: 4
    });

    if (autoPickTopRec && recs.length > 0) {
      syncQuickAddDefaults(recs[0].ex.id, recs[0].modeName);
    }

    const recList = document.getElementById("quickAddRecList");
    if (recList) {
      if (!recs.length) {
        recList.innerHTML = `<div style="font-size:12px; color:var(--text-muted); text-align:center; padding:12px;">조건에 맞는 추천 종목이 없습니다. 아래 전체 검색에서 직접 선택해 보세요.</div>`;
      } else {
        recList.innerHTML = recs
          .map(r => {
            const ex = r.ex;
            const isSel = ex.id === quickAddSelectedId;
            const wText = ex.defaultWeightKg > 0 ? `${ex.defaultWeightKg}kg · ` : "";
            return `
              <button type="button" class="btn-tap quick-rec-card ${isSel ? "is-selected" : ""}" data-rec-pick="${ex.id}" data-rec-mode-name="${r.modeName}">
                <div class="row-between" style="width:100%; gap:6px;">
                  <div class="row-gap" style="gap:4px; min-width:0;">
                    <span class="badge ${ex.mode === "gym" ? "badge-purple" : "badge-lime"}" style="font-size:9.5px; padding:1px 6px;">${ex.mode === "gym" ? "🏋️ 기구" : "🏠 홈트"}</span>
                    <span style="font-size:10.5px; color:var(--text-muted); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${ex.category}</span>
                  </div>
                  <span class="tabular-nums" style="font-size:10.5px; color:var(--text-soft); font-weight:700; flex-shrink:0;">${wText}${ex.defaultSets}세트 × ${ex.defaultReps}</span>
                </div>
                <div style="font-size:14px; font-weight:900; color:#ffffff;">${ex.name}</div>
                <div class="quick-rec-reason">✨ ${r.reason}</div>
              </button>
            `;
          })
          .join("");

        recList.querySelectorAll("[data-rec-pick]").forEach(btn => {
          btn.addEventListener("click", () => {
            syncQuickAddDefaults(btn.dataset.recPick, btn.dataset.recModeName || "맞춤 추천");
          });
        });
      }
    }

    renderQuickAddCatalogOptions();
  }

  function openQuickAddModal(preselectExId = null, options = {}) {
    quickAddRecMode = "custom";
    quickAddSearchQuery = "";
    const searchInput = document.getElementById("quickAddSearchInput");
    if (searchInput) searchInput.value = "";

    if (preselectExId) {
      quickAddSelectedReason = "직접 선택";
      syncQuickAddDefaults(preselectExId, "직접 선택");
      renderQuickAddSheet(false);
    } else {
      quickAddSelectedId = null;
      quickAddSelectedReason = EXTRA_MODES[0].name;
      renderQuickAddSheet(true);
      if (!quickAddSelectedId) {
        const sorted = renderQuickAddCatalogOptions();
        if (sorted[0]) syncQuickAddDefaults(sorted[0].id, "직접 선택");
      }
    }
    const modal = document.getElementById("quickAddModal");
    if (modal) {
      const alreadyOpen = !modal.classList.contains("hidden");
      modal.classList.remove("hidden");
      if (uiHistory) {
        if (options && options.replaceLayer) uiHistory.replace(options.replaceLayer, "quickAddModal");
        else if (!alreadyOpen) uiHistory.push("quickAddModal");
      }
    }
  }

  function closeQuickAddModal(fromPopState = false, syncHistory = true) {
    const modal = document.getElementById("quickAddModal");
    const wasOpen = modal && !modal.classList.contains("hidden");
    if (modal) modal.classList.add("hidden");
    if (syncHistory && wasOpen && uiHistory) {
      if (fromPopState) uiHistory.clearTag("quickAddModal");
      else uiHistory.pop("quickAddModal");
    }
  }

  function closeSwapModal(fromPopState = false) {
    const modal = document.getElementById("swapModal");
    const wasOpen = modal && !modal.classList.contains("hidden");
    if (modal) modal.classList.add("hidden");
    if (wasOpen && uiHistory) {
      if (fromPopState) uiHistory.clearTag("swapModal");
      else uiHistory.pop("swapModal");
    }
  }

  function renderSwapModalBody() {
    const items = store.getTodayRoutineExercises();
    const ex = items[swapTargetIdx];
    if (!ex) return;

    const titleEl = document.getElementById("swapModalTitle");
    if (titleEl) titleEl.textContent = `${ex.name} 대체 선택`;

    // Update reason chip active classes
    document.querySelectorAll("#swapReasonChips [data-swap-reason]").forEach(btn => {
      const r = btn.dataset.swapReason;
      btn.classList.remove("active-ok", "active-pain");
      if (r === swapReason) {
        btn.classList.add(r === "pain" ? "active-pain" : "active-ok");
      }
    });

    // Update Home vs Gym filter tab active classes
    const homeBtn = document.getElementById("swapTabHomeBtn");
    const gymBtn = document.getElementById("swapTabGymBtn");
    if (homeBtn) homeBtn.classList.toggle("active", swapTabMode === "home");
    if (gymBtn) gymBtn.classList.toggle("active", swapTabMode === "gym");

    const painAreas =
      store.state.bodyCondition && Array.isArray(store.state.bodyCondition.painAreas)
        ? store.state.bodyCondition.painAreas
        : [];
    const cands = getSwapCandidates(ex, swapTabMode, painAreas, store.state.customExercises, store.state.dislikedExercises);
    const listWrap = document.getElementById("swapCandidateList");
    if (!listWrap) return;

    if (!cands.length) {
      listWrap.innerHTML = `<div style="font-size:12px; color:var(--text-muted); text-align:center; padding:16px;">해당 모드에 대응하는 추천 종목이 없습니다.</div>`;
      return;
    }

    const todayDate = getWorkoutDateStr();
    listWrap.innerHTML = cands
      .map(c => {
        const cand = c.ex;
        const isPain = c.badgeType === "pain_active" || c.badgeType === "pain_alt";
        const badgeCls = isPain ? "badge-amber" : "badge-lime";
        const prev = store.getLastRecord(cand.id, cand.name, todayDate);
        const w = prev && prev.data && (prev.data.actualWeightKg ?? prev.data.plannedWeightKg) > 0
          ? `${prev.data.actualWeightKg ?? prev.data.plannedWeightKg}kg (최근기록)`
          : cand.defaultWeightKg > 0
            ? `${cand.defaultWeightKg}kg`
            : "맨몸/소도구";
        return `
          <button type="button" class="btn-tap swap-cand-card ${c.badgeType === "pain_active" ? "is-pain-safe" : ""}" data-swap-pick="${cand.id}">
            <div class="row-between" style="width:100%; gap:6px;">
              <div class="row-gap" style="gap:4px; flex-wrap:wrap;">
                <span class="badge ${badgeCls}" style="font-size:10px;">${c.tagText}</span>
                ${c.isDisliked ? `<span class="badge badge-rose" style="font-size:9.5px;">👎 비선호</span>` : ""}
              </div>
              <span style="font-size:10.5px; color:var(--text-muted); font-weight:700;">${cand.defaultSets}세트 × ${cand.defaultReps} · ${w}</span>
            </div>
            <div style="font-size:14.5px; font-weight:900; color:#ffffff;">${cand.name}</div>
            <div style="font-size:11px; color:var(--accent); font-weight:700;">${cand.targetMuscle}</div>
            ${c.reasonText ? `<div style="font-size:10.5px; color:var(--text-soft); line-height:1.35;">💡 ${c.reasonText}</div>` : ""}
          </button>
        `;
      })
      .join("");

    listWrap.querySelectorAll("[data-swap-pick]").forEach(btn => {
      btn.addEventListener("click", () => {
        const altId = btn.dataset.swapPick;
        const ok = store.replaceTodayRoutineExercise(swapTargetIdx, altId, swapReason);
        closeSwapModal();
        if (ok) {
          sync.scheduleAutoPush(300);
          onRenderAll();
          const updated = store.getTodayRoutineExercises()[swapTargetIdx];
          showToast(`🔄 [${(updated && updated.name) || altId}](으)로 교체되었습니다.`);
        }
      });
    });
  }

  function openSwapModal(cardIdx) {
    const items = store.getTodayRoutineExercises();
    const ex = items[cardIdx];
    if (!ex) return;
    swapTargetIdx = cardIdx;
    swapTabMode = ex.mode === "gym" ? "gym" : "home";
    const painAreas =
      store.state.bodyCondition && Array.isArray(store.state.bodyCondition.painAreas)
        ? store.state.bodyCondition.painAreas
        : [];
    const alertAlt = findPainAlertAlternative(ex, painAreas);
    swapReason = alertAlt ? "pain" : "variation";
    swapReasonManual = false;
    renderSwapModalBody();
    const modal = document.getElementById("swapModal");
    if (modal) {
      const alreadyOpen = !modal.classList.contains("hidden");
      modal.classList.remove("hidden");
      if (!alreadyOpen && uiHistory) uiHistory.push("swapModal");
    }
  }

  function closeRpeBottomSheet(fromPopState = false, syncHistory = true) {
    pendingRpeExerciseId = null;
    const sheet = document.getElementById("rpeBottomSheet");
    const wasOpen = sheet && !sheet.classList.contains("hidden");
    if (sheet) sheet.classList.add("hidden");
    if (syncHistory && wasOpen && uiHistory) {
      if (fromPopState) uiHistory.clearTag("rpeBottomSheet");
      else uiHistory.pop("rpeBottomSheet");
    }
  }

  function closeAddExModal(fromPopState = false) {
    const modal = document.getElementById("addExModal");
    const wasOpen = modal && !modal.classList.contains("hidden");
    if (modal) modal.classList.add("hidden");
    if (wasOpen && uiHistory) {
      if (fromPopState) uiHistory.clearTag("addExModal");
      else uiHistory.pop("addExModal");
    }
  }

  function closeTopModal(fromPopState = false) {
    const isVis = id => {
      const el = document.getElementById(id);
      return el && !el.classList.contains("hidden");
    };
    if (isVis("zoomModal")) { closeGuideModal(fromPopState); return true; }
    if (isVis("rpeBottomSheet")) { closeRpeBottomSheet(fromPopState); return true; }
    if (isVis("swapModal")) { closeSwapModal(fromPopState); return true; }
    if (isVis("quickAddModal")) { closeQuickAddModal(fromPopState); return true; }
    if (isVis("reportModal")) { closeCompletionReportModal(fromPopState); return true; }
    if (isVis("addExModal")) { closeAddExModal(fromPopState); return true; }
    return false;
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
    if (sheet) {
      const alreadyOpen = !sheet.classList.contains("hidden");
      sheet.classList.remove("hidden");
      if (!alreadyOpen && uiHistory) uiHistory.push("rpeBottomSheet");
    }
  }

  function finalizeFinishWithRpe(rpe) {
    if (!pendingRpeExerciseId) return;
    const exId = pendingRpeExerciseId;
    pendingRpeExerciseId = null;
    const sheet = document.getElementById("rpeBottomSheet");
    const wasOpen = sheet && !sheet.classList.contains("hidden");
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

    if (sync && typeof sync.commitTodayHistory === "function") {
      sync.commitTodayHistory();
    } else {
      store.refreshMetrics();
      store.persistState();
    }
    sync.scheduleAutoPush(300);

    const hasRemaining = store.getTodayRoutineExercises().some(item => !store.getRecord(item).isCompleted);
    if (!hasRemaining && uiHistory) {
      uiHistory.clearTag("card");
      if (wasOpen) {
        uiHistory.replace("rpeBottomSheet", "reportModal");
        // Clear flag so openCompletionReportModal knows layer is set cleanly
      }
    } else if (wasOpen && uiHistory) {
      uiHistory.pop("rpeBottomSheet");
    }

    moveToNextIncompleteExercise();
  }

  function bindModalEvents() {
    document.getElementById("rpeSkipBtn")?.addEventListener("click", () => finalizeFinishWithRpe(null));
    document.querySelectorAll(".rpe-btn").forEach(btn => {
      btn.addEventListener("click", () => finalizeFinishWithRpe(Number(btn.dataset.rpe)));
    });
    document.getElementById("rpeBottomSheet")?.addEventListener("click", e => {
      if (e.target.id === "rpeBottomSheet") closeRpeBottomSheet();
    });

    document.getElementById("zoomModalCloseBtn")?.addEventListener("click", () => closeGuideModal());
    document.getElementById("zoomModal")?.addEventListener("click", e => {
      if (e.target.id === "zoomModal") closeGuideModal();
    });

    document.getElementById("reportModalCloseBtn")?.addEventListener("click", () => closeCompletionReportModal());
    document.getElementById("reportModal")?.addEventListener("click", e => {
      if (e.target.id === "reportModal") {
        closeCompletionReportModal();
      } else if (e.target.closest("#reportOpenExtraBtn")) {
        document.getElementById("reportModal")?.classList.add("hidden");
        openQuickAddModal(null, { replaceLayer: "reportModal" });
      }
    });

    document.getElementById("quickAddCloseBtn")?.addEventListener("click", () => closeQuickAddModal());
    document.getElementById("quickAddModal")?.addEventListener("click", e => {
      if (e.target.id === "quickAddModal") closeQuickAddModal();
    });
    document.querySelectorAll("#quickAddModeChips [data-rec-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        quickAddRecMode = btn.dataset.recMode || "custom";
        const modeMeta = EXTRA_MODES.find(m => m.id === quickAddRecMode) || EXTRA_MODES[0];
        quickAddSelectedReason = modeMeta.name;
        renderQuickAddSheet(true);
      });
    });
    document.getElementById("quickAddSearchInput")?.addEventListener("input", e => {
      quickAddSearchQuery = e.target.value || "";
      const filtered = renderQuickAddCatalogOptions();
      if (quickAddSearchQuery.trim() && filtered.length > 0 && !filtered.some(x => x.id === quickAddSelectedId)) {
        syncQuickAddDefaults(filtered[0].id, "검색 선택");
      }
    });
    document.getElementById("quickAddExSelect")?.addEventListener("change", e => {
      if (e.target.value) syncQuickAddDefaults(e.target.value, "직접 선택");
    });
    ["quickAddSets", "quickAddReps", "quickAddWeight"].forEach(id => {
      document.getElementById(id)?.addEventListener("input", () => {
        quickAddActivePreset = "custom";
        document.querySelectorAll("#quickAddPresetChips [data-vol-preset]").forEach(b => b.classList.remove("active"));
      });
    });
    document.getElementById("quickAddConfirmBtn")?.addEventListener("click", () => {
      const selVal = document.getElementById("quickAddExSelect")?.value;
      const exId = quickAddSelectedId || selVal;
      if (!exId) {
        showToast("추가할 운동 종목을 선택해 주세요.");
        return;
      }
      const sets = Math.max(1, Number(document.getElementById("quickAddSets")?.value) || 3);
      const reps = (document.getElementById("quickAddReps")?.value || "").trim() || "10회";
      const weightVal = Number(document.getElementById("quickAddWeight")?.value);
      const weightKg = Number.isNaN(weightVal) || weightVal <= 0 ? 0 : weightVal;
      const reasonName = quickAddSelectedReason || "맞춤 추천";
      const idx = store.addExerciseToTodayRoutine(exId, {
        sets,
        reps,
        weightKg,
        isExtra: true,
        extraReason: reasonName
      });
      const wasCard = store.state.todayScreen === "card" && store.state.activeTab === "today";
      if (wasCard) {
        closeQuickAddModal();
      } else {
        closeQuickAddModal(false, false);
        if (uiHistory && idx >= 0) uiHistory.replace("quickAddModal", "card");
      }
      if (idx >= 0) {
        const added = store.getTodayRoutineExercises()[idx];
        store.state.activeTab = "today";
        store.state.todayScreen = "card";
        store.state.todayCardIndex = idx;
        if (sync && typeof sync.commitTodayHistory === "function") {
          sync.commitTodayHistory();
        } else {
          store.persistState();
        }
        sync.scheduleAutoPush(300);
        onRenderAll();
        showToast(`⚡ [${(added && added.name) || exId}] ${sets}세트 × ${reps} 추가됨 (${reasonName})!`);
      }
    });

    document.getElementById("swapModalCloseBtn")?.addEventListener("click", () => closeSwapModal());
    document.getElementById("swapModal")?.addEventListener("click", e => {
      if (e.target.id === "swapModal") closeSwapModal();
    });
    document.querySelectorAll("#swapReasonChips [data-swap-reason]").forEach(btn => {
      btn.addEventListener("click", () => {
        swapReason = btn.dataset.swapReason;
        swapReasonManual = true;
        renderSwapModalBody();
      });
    });
    document.querySelectorAll("#swapModal [data-swap-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        swapTabMode = btn.dataset.swapMode;
        const ex = store.getTodayRoutineExercises()[swapTargetIdx];
        if (!swapReasonManual && ex && ex.mode !== swapTabMode && swapReason !== "pain") {
          swapReason = "gym_switch";
        }
        renderSwapModalBody();
      });
    });

    document.getElementById("addCustomExBtn")?.addEventListener("click", () => {
      const modal = document.getElementById("addExModal");
      if (modal) {
        const alreadyOpen = !modal.classList.contains("hidden");
        modal.classList.remove("hidden");
        if (!alreadyOpen && uiHistory) uiHistory.push("addExModal");
      }
    });
    document.getElementById("addExModalCloseBtn")?.addEventListener("click", () => closeAddExModal());
    document.getElementById("addExModal")?.addEventListener("click", e => {
      if (e.target.id === "addExModal") closeAddExModal();
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
      closeAddExModal();
      document.getElementById("newExName").value = "";
      showToast(`✅ [${newEx.name}] 추가 완료!`);
      onRenderAll();
    });
  }

  return {
    openExerciseGuideModal,
    openCompletionReportModal,
    closeCompletionReportModal,
    openQuickAddModal,
    closeQuickAddModal,
    openSwapModal,
    closeSwapModal,
    closeTopModal,
    directFinishExercise,
    openRpeBottomSheet,
    finalizeFinishWithRpe,
    moveToNextIncompleteExercise,
    bindModalEvents
  };
}
