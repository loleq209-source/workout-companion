/**
 * Workout Companion v3.0 Entry Point & Lifecycle Orchestrator.
 */
import { createStore } from "./store.mjs";
import { createTimerController, createWorkTimerController } from "./timer.mjs";
import { createSyncService } from "./sync.mjs";
import { createUiHistory } from "./uiHistory.mjs";
import { hasGasBridge } from "./bridge.mjs";
import { showToast, updateSyncBadge, setSyncStatusMsg } from "./ui/toast.mjs";
import { createModalController } from "./ui/modals.mjs";
import { renderDashboard } from "./ui/dashboard.mjs";
import { createCardController, updateTimerDom, updateWorkTimerDom } from "./ui/card.mjs";
import { renderCatalog } from "./ui/catalog.mjs";
import { renderSyncTab, renderMetricsCards } from "./ui/syncTab.mjs";

const store = createStore();

let sync = null;
let modals = null;
let cardCtrl = null;
let timerCtrl = null;
let workTimerCtrl = null;

function updateFloatingTimerPill() {
  const pill = document.getElementById("floatingRestPill");
  const textEl = document.getElementById("floatingRestText");
  if (!pill || !textEl || !timerCtrl) return;

  const t = timerCtrl.timer;
  const viewingActiveTimerCard =
    store.state.activeTab === "today" &&
    store.state.todayScreen === "card" &&
    (store.getTodayRoutineExercises()[store.state.todayCardIndex] || {}).id === t.exerciseId;

  if (t.running && !viewingActiveTimerCard) {
    const m = String(Math.floor(t.remaining / 60)).padStart(2, "0");
    const s = String(t.remaining % 60).padStart(2, "0");
    textEl.textContent = `${m}:${s} · 휴식 중 (눌러서 이동)`;
    pill.classList.remove("hidden");
  } else {
    pill.classList.add("hidden");
  }
}

function renderAll() {
  store.ensureCurrentSessionDate();
  const state = store.state;

  document.getElementById("tabToday")?.classList.toggle("hidden", state.activeTab !== "today");
  document.getElementById("tabCatalog")?.classList.toggle("hidden", state.activeTab !== "catalog");
  document.getElementById("tabSync")?.classList.toggle("hidden", state.activeTab !== "sync");

  document.getElementById("navTodayBtn")?.classList.toggle("active", state.activeTab === "today");
  document.getElementById("navCatalogBtn")?.classList.toggle("active", state.activeTab === "catalog");
  document.getElementById("navSyncBtn")?.classList.toggle("active", state.activeTab === "sync");

  if (state.activeTab === "today") {
    document.getElementById("viewDashboard")?.classList.toggle("hidden", state.todayScreen !== "dashboard");
    document.getElementById("viewCard")?.classList.toggle("hidden", state.todayScreen !== "card");

    if (state.todayScreen === "dashboard") {
      renderDashboard({
        store,
        sync,
        onRenderAll: renderAll,
        showToast,
        onSelectExercise: idx => {
          const prevScreen = state.todayScreen;
          state.todayCardIndex = idx;
          state.todayScreen = "card";
          if (prevScreen !== "card") uiHistory.push("card");
          renderAll();
        }
      });
    } else {
      cardCtrl.renderCardStepBar();
      cardCtrl.renderFocusedCard();
    }
  } else if (state.activeTab === "catalog") {
    renderCatalog({ store, sync, modals, onRenderAll: renderAll, showToast });
  } else if (state.activeTab === "sync") {
    renderSyncTab(store);
  }

  updateFloatingTimerPill();
}

timerCtrl = createTimerController(store, {
  onTick: t => {
    updateTimerDom(t);
    updateFloatingTimerPill();
  },
  onComplete: label => {
    updateFloatingTimerPill();
    showToast(`⏰ [${label}] 휴식이 완료되었습니다!`);
  }
});

workTimerCtrl = createWorkTimerController(store, {
  onTick: wt => {
    const items = store.getTodayRoutineExercises();
    const curEx = items[store.state.todayCardIndex];
    if (curEx && wt.exerciseId === curEx.id) {
      updateWorkTimerDom(wt);
    }
  },
  onComplete: (label, wt) => {
    updateWorkTimerDom(wt);
    showToast(`✅ [${label}] ${wt.duration}초 수행 완료! 완료 버튼을 눌러 체크하세요.`);
  }
});

sync = createSyncService(store, {
  onBadge: updateSyncBadge,
  onStatus: setSyncStatusMsg,
  onToast: showToast,
  onLoaded: renderAll,
  onMetricsUpdated: () => {
    if (store.state.activeTab === "sync") {
      renderMetricsCards(store);
    }
  }
});

const uiHistory = createUiHistory(() => {
  if (modals && modals.closeTopModal(true)) return;
  if (store.state.activeTab === "today" && store.state.todayScreen === "card") {
    store.state.todayScreen = "dashboard";
    renderAll();
    return;
  }
  if (store.state.activeTab !== "today") {
    store.state.activeTab = "today";
    store.persistState();
    renderAll();
  }
});

modals = createModalController({ store, sync, uiHistory, onRenderAll: renderAll, showToast });
cardCtrl = createCardController({ store, timerCtrl, workTimerCtrl, sync, modals, onRenderAll: renderAll, showToast });

// Hook called by Android MainActivity.onResume() when returning to WebView
let lastAutoSyncAt = 0;
function triggerThrottledAutoSync() {
  timerCtrl.syncWithClock();
  workTimerCtrl.syncWithClock();
  const rolled = store.ensureCurrentSessionDate();
  if (rolled) renderAll();
  const now = Date.now();
  if (now - lastAutoSyncAt >= 30000 && (hasGasBridge() || store.state.gasUrl)) {
    lastAutoSyncAt = now;
    sync.runAutoSync();
  }
}

if (typeof window !== "undefined") {
  window.onNativeResume = triggerThrottledAutoSync;
}

document.addEventListener("DOMContentLoaded", () => {
  cardCtrl.initSwipeGesture();
  modals.bindModalEvents();
  uiHistory.attach();

  // Register Service Worker for true offline PWA support
  if ("serviceWorker" in navigator && !hasGasBridge() && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  // Bottom Navigation
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const nextTab = btn.dataset.tab;
      const prevTab = store.state.activeTab;
      if (nextTab === "today" && prevTab !== "today") {
        uiHistory.pop("tab");
      } else if (nextTab !== "today" && prevTab === "today") {
        uiHistory.push("tab");
      }
      store.state.activeTab = nextTab;
      store.persistState();
      renderAll();
    });
  });

  // Floating Rest Mini Pill jump back to active card OR quick skip rest
  document.getElementById("floatingRestJumpBtn")?.addEventListener("click", () => {
    const items = store.getTodayRoutineExercises();
    const idx = items.findIndex(x => x.id === timerCtrl.timer.exerciseId);
    const prevTab = store.state.activeTab;
    const prevScreen = store.state.todayScreen;
    store.state.activeTab = "today";
    store.state.todayScreen = "card";
    if (prevTab !== "today") uiHistory.clearTag("tab");
    if (prevScreen !== "card") uiHistory.push("card");
    if (idx !== -1) store.state.todayCardIndex = idx;
    renderAll();
  });

  document.getElementById("floatingRestSkipBtn")?.addEventListener("click", e => {
    e.stopPropagation();
    if (typeof timerCtrl.skip === "function") timerCtrl.skip();
    updateFloatingTimerPill();
    showToast("⏭ 휴식을 스킵했습니다.");
  });

  // Dashboard CTA & Quick Add
  document.getElementById("dashCtaBtn")?.addEventListener("click", () => {
    const items = store.getTodayRoutineExercises();
    const firstIncomplete = items.findIndex(e => !store.getRecord(e).isCompleted);
    const prevScreen = store.state.todayScreen;
    store.state.todayScreen = "card";
    store.state.todayCardIndex = firstIncomplete !== -1 ? firstIncomplete : 0;
    if (prevScreen !== "card") uiHistory.push("card");
    renderAll();
  });

  document.getElementById("dashQuickAddBtn")?.addEventListener("click", () => {
    if (store.state.activeTab === "today") uiHistory.push("tab");
    store.state.activeTab = "catalog";
    store.persistState();
    renderAll();
  });

  document.getElementById("dashBottomAddBtn")?.addEventListener("click", () => {
    modals.openQuickAddModal();
  });

  document.getElementById("dashQuickModeBtn")?.addEventListener("click", () => {
    const res = store.toggleQuickMode();
    if (res.reverted || res.compressedCount > 0) {
      if (typeof sync.commitTodayHistory === "function") sync.commitTodayHistory();
      sync.scheduleAutoPush(400);
      renderAll();
      if (res.reverted) {
        showToast(`↩ 원래 세트 수로 복구했습니다! (예상 약 ${res.estimatedMinutes}분)`);
      } else {
        showToast(`⚡ ${res.compressedCount}개 근력 종목 2세트 압축! (예상 약 ${res.estimatedMinutes}분)`);
      }
    } else {
      showToast("압축할 미완료 3세트+ 근력 종목이 없습니다.");
    }
  });

  document.getElementById("dashModeSwapBtn")?.addEventListener("click", () => {
    const res = store.toggleRoutineMode();
    renderAll();
    sync.scheduleAutoPush(400);
    if (res.reverted) {
      showToast(`🔄 ${res.targetMode === "gym" ? "헬스 기구" : "홈트"} 루틴 원래 상태로 복구했습니다!`);
    } else if (res.convertedCount > 0) {
      showToast(`🔄 ${res.convertedCount}개 종목을 ${res.targetMode === "gym" ? "🏋️ 헬스 기구" : "🏠 홈트"}로 일괄 변환했습니다!`);
    } else {
      showToast("변환할 미완료 종목이 없습니다.");
    }
  });

  document.getElementById("dashReportBtn")?.addEventListener("click", () => {
    modals.openCompletionReportModal();
  });

  document.getElementById("syncReportBtn")?.addEventListener("click", () => {
    modals.openCompletionReportModal();
  });

  // Card Screen Top Controls
  document.getElementById("cardBackBtn")?.addEventListener("click", () => {
    store.state.todayScreen = "dashboard";
    uiHistory.pop("card");
    renderAll();
  });

  document.getElementById("cardPrevBtn")?.addEventListener("click", () => {
    cardCtrl.navigateCardWithSwipe(-1);
  });

  document.getElementById("cardNextBtn")?.addEventListener("click", () => {
    cardCtrl.navigateCardWithSwipe(1);
  });

  document.getElementById("cardDirectFinishBtn")?.addEventListener("click", () => {
    const items = store.getTodayRoutineExercises();
    const ex = items[store.state.todayCardIndex] || items[0];
    if (ex) {
      modals.openRpeBottomSheet(ex, store.getRecord(ex));
    }
  });

  // Catalog Filters
  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      store.state.mode = btn.dataset.mode;
      store.persistState();
      renderCatalog({ store, sync, modals, onRenderAll: renderAll, showToast });
    });
  });

  document.getElementById("catalogSearchInput")?.addEventListener("input", e => {
    store.state.searchQuery = e.target.value;
    renderCatalog({ store, sync, modals, onRenderAll: renderAll, showToast });
  });

  document.getElementById("catalogPrefFilter")?.addEventListener("change", e => {
    store.state.catalogFilter = e.target.value;
    store.persistState();
    renderCatalog({ store, sync, modals, onRenderAll: renderAll, showToast });
  });

  // Sync Tab Controls
  document.getElementById("soundToggleBtn")?.addEventListener("click", () => {
    store.state.soundEnabled = !store.state.soundEnabled;
    store.persistState();
    renderSyncTab(store);
    showToast(store.state.soundEnabled ? "🔔 타이머 완료 알림음 켜짐" : "🔕 타이머 완료 알림음 꺼짐");
  });

  document.getElementById("saveGasUrlBtn")?.addEventListener("click", () => {
    store.state.gasUrl = document.getElementById("gasUrlInput").value.trim();
    store.persistState();
    showToast("Apps Script URL이 저장되었습니다.");
  });

  // Full Backup JSON Export / Import
  document.getElementById("exportJsonBtn")?.addEventListener("click", () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      history: store.state.history,
      records: store.state.records,
      customExercises: store.state.customExercises,
      todayRoutine: store.state.todayRoutine,
      metrics: store.refreshMetrics()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `workout_companion_backup_${store.state.sessionDate}.json`;
    a.click();
    showToast("📥 전체 백업 JSON이 다운로드되었습니다.");
  });

  document.getElementById("importJsonInput")?.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.records) store.state.records = data.records;
        if (data.history) store.state.history = data.history;
        if (data.customExercises) store.state.customExercises = data.customExercises;
        if (data.todayRoutine) store.state.todayRoutine = data.todayRoutine;
        store.refreshMetrics();
        store.persistState();
        sync.scheduleAutoPush(300);
        renderAll();
        showToast("JSON 데이터를 성공적으로 불러왔습니다!");
      } catch (err) {
        showToast("올바른 JSON 파일이 아닙니다.");
      }
    };
    reader.readAsText(file);
  });

  if (store.state.lastSyncAt) {
    updateSyncBadge(`자동 동기화 ${store.state.lastSyncAt}`);
  }
  renderAll();

  if (hasGasBridge() || store.state.gasUrl) {
    lastAutoSyncAt = Date.now();
    sync.runAutoSync();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    triggerThrottledAutoSync();
  }
});

window.addEventListener("pageshow", () => {
  triggerThrottledAutoSync();
});
