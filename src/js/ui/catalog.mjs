/**
 * Tab 2: Interactive Exercise Catalog, Working Presets, Preference Toggles,
 * Custom Delete, Last Record Hints, and +Add to Today Mission.
 */
import { PRESETS, getAllExercises } from "../data.mjs";

export function renderCatalog({ store, sync, modals, onRenderAll, showToast }) {
  const state = store.state;
  const allEx = getAllExercises(state.customExercises);

  // Update dynamic mode counts + active button classes
  const homeCount = allEx.filter(x => x.mode === "home").length;
  const gymCount = allEx.filter(x => x.mode === "gym").length;
  const totalCount = allEx.length;

  document.querySelectorAll(".mode-btn").forEach(btn => {
    const m = btn.dataset.mode;
    btn.classList.toggle("active", state.mode === m);
    if (m === "home") btn.textContent = `🏠 홈트 (${homeCount})`;
    else if (m === "gym") btn.textContent = `🏋️ 헬스장 (${gymCount})`;
    else if (m === "all") btn.textContent = `🌟 전체 (${totalCount})`;
  });

  // Presets Chips
  const presetWrap = document.getElementById("presetChipsWrap");
  if (presetWrap) {
    presetWrap.innerHTML = PRESETS.map(p => {
      const isActive = state.preset === p.id;
      return `
        <button type="button" class="btn-tap badge ${isActive ? "badge-lime" : "badge-muted"}" data-preset-id="${p.id}" style="padding:6px 12px; font-size:12px; border-radius:12px; flex:0 0 auto;">
          ${p.name}
        </button>
      `;
    }).join("");

    presetWrap.querySelectorAll("[data-preset-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.preset = btn.dataset.presetId;
        store.persistState();
        renderCatalog({ store, sync, modals, onRenderAll, showToast });
      });
    });
  }

  const prefSel = document.getElementById("catalogPrefFilter");
  if (prefSel) prefSel.value = state.catalogFilter || "all";

  const listContainer = document.getElementById("catalogList");
  if (!listContainer) return;

  const items = store.getFilteredCatalogExercises();
  if (!items.length) {
    listContainer.innerHTML = `<div class="card-surface cat-empty-state" style="text-align:center; color:var(--text-muted); font-size:12.5px; padding:20px;">조건에 맞는 운동 종목이 없습니다. 프리셋이나 필터를 조정해 보세요.</div>`;
    return;
  }

  const todayItems = store.getTodayRoutineExercises();
  const todayById = new Map(todayItems.map(x => [x.id, x]));

  listContainer.innerHTML = items
    .map(ex => {
      const effectiveEx = todayById.get(ex.id) || ex;
      const rec = store.getRecord(effectiveEx);
      const isDone = rec.isCompleted;
      const isInToday = todayById.has(ex.id);
      const isCustom = String(ex.id).startsWith("custom_");
      const last = store.getLastRecord(ex.id, ex.name);
      const pref = rec.preference;

      return `
        <div class="card-surface stack-2 cat-card" data-ex-id="${ex.id}" style="padding:12px 14px; cursor:pointer;">
          <div class="row-between" style="gap:6px;">
            <div class="row-gap" style="gap:5px; min-width:0; flex:1; flex-wrap:wrap;">
              <span class="badge ${ex.mode === "home" ? "badge-lime" : "badge-purple"}">${ex.mode === "home" ? "🏠 홈트" : "🏋️ 기구"}</span>
              <span class="badge badge-muted" style="max-width:140px; overflow:hidden; text-overflow:ellipsis;">${ex.equipment}</span>
              ${last ? `<span class="badge badge-muted" style="font-size:10px;">최근 ${last.date.slice(5)}</span>` : ""}
            </div>
            <div class="row-gap" style="gap:4px; flex-shrink:0;">
              <button type="button" class="btn-tap badge ${pref === "like" ? "badge-lime" : "badge-muted"}" data-cat-act="pref-like" data-ex-id="${ex.id}" style="padding:3px 7px;" title="선호">⭐</button>
              <button type="button" class="btn-tap badge ${pref === "dislike" ? "badge-rose" : "badge-muted"}" data-cat-act="pref-dislike" data-ex-id="${ex.id}" style="padding:3px 7px;" title="비선호">👎</button>
              ${isCustom ? `<button type="button" class="btn-tap badge badge-rose" data-cat-act="delete-custom" data-ex-id="${ex.id}" style="padding:3px 7px;" title="삭제">🗑️</button>` : ""}
            </div>
          </div>

          <div class="row-between" style="gap:8px; align-items:flex-end;">
            <div style="min-width:0; flex:1;">
              <div style="font-size:15px; font-weight:800; color:#fff; word-break:keep-all;">${ex.name}</div>
              <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">${ex.targetMuscle} · ${ex.defaultSets}세트 × ${ex.defaultReps}</div>
            </div>
            <button type="button" class="btn-tap badge ${isInToday ? (isDone ? "badge-lime" : "badge-amber") : "badge-lime"}" data-cat-act="add-jump" data-ex-id="${ex.id}" style="padding:5px 10px; flex-shrink:0;">
              ${isInToday ? (isDone ? "✓ 완료·이동" : "미션 이동 ➔") : "+ 오늘 루틴에 추가"}
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  listContainer.querySelectorAll(".cat-card").forEach(card => {
    card.addEventListener("click", e => {
      if (e.target.closest("[data-cat-act]")) return;
      const ex = allEx.find(x => x.id === card.dataset.exId);
      if (ex) modals.openExerciseGuideModal(ex, "full");
    });
  });

  listContainer.querySelectorAll("[data-cat-act]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const act = btn.dataset.catAct;
      const id = btn.dataset.exId;
      const ex = allEx.find(x => x.id === id);
      if (!ex) return;
      const effectiveEx = todayById.get(ex.id) || ex;
      const rec = store.getRecord(effectiveEx);

      if (act === "pref-like") {
        store.setExercisePreference(ex.id, rec.preference === "like" ? null : "like");
        sync.pushToGoogleDrive(true);
        renderCatalog({ store, sync, modals, onRenderAll, showToast });
      } else if (act === "pref-dislike") {
        const isNowDisliked = store.setExercisePreference(ex.id, rec.preference === "dislike" ? null : "dislike");
        sync.pushToGoogleDrive(true);
        showToast(isNowDisliked ? `👎 [${ex.name}] 비선호로 설정됨` : `↺ [${ex.name}] 비선호 해제됨`);
        renderCatalog({ store, sync, modals, onRenderAll, showToast });
      } else if (act === "add-jump") {
        const existingIdx = store.getTodayRoutineExercises().findIndex(x => x.id === ex.id);
        if (existingIdx !== -1) {
          store.state.activeTab = "today";
          store.state.todayScreen = "card";
          store.state.todayCardIndex = existingIdx;
          store.persistState();
          onRenderAll();
        } else if (modals && typeof modals.openQuickAddModal === "function") {
          modals.openQuickAddModal(ex.id);
        } else {
          const idx = store.addExerciseToTodayRoutine(ex.id);
          if (idx >= 0) {
            store.state.activeTab = "today";
            store.state.todayScreen = "card";
            store.state.todayCardIndex = idx;
            store.persistState();
            sync.scheduleAutoPush(600);
            onRenderAll();
            showToast(`🎯 [${ex.name}] 오늘 미션에서 바로 시작합니다!`);
          }
        }
      } else if (act === "delete-custom") {
        store.state.customExercises = store.state.customExercises.filter(x => x.id !== id);
        store.persistState();
        sync.scheduleAutoPush(600);
        showToast(`🗑️ [${ex.name}] 삭제되었습니다.`);
        renderCatalog({ store, sync, modals, onRenderAll, showToast });
      }
    });
  });
}
