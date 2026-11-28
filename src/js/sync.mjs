/**
 * Bidirectional Google Drive Sync, Payload Builder, and Anti-Midnight Contamination Guard.
 */
import { getTodayStr, getWorkoutDateStr, formatLocalTimeHHMM } from "./date.mjs";
import { hasGasBridge } from "./bridge.mjs";
import { calculateWorkoutMetrics } from "./metrics.mjs";
import { ENRICHED_DB } from "./data.mjs";

export function buildWorkoutLogPayload(store, targetDate = getWorkoutDateStr()) {
  const state = store.state;
  const items = store.getTodayRoutineExercises();
  const nowIso = new Date().toISOString();

  const routineItems = items.map(ex => {
    const rec = store.getRecord(ex, targetDate);
    const setsArr = Array.isArray(rec.sets) ? rec.sets : [];
    const doneSets = setsArr.filter(s => s && s.done).length;
    const totalSets = setsArr.length || ex.defaultSets || 3;
    const w =
      setsArr[0] && typeof setsArr[0].weightKg === "number"
        ? setsArr[0].weightKg
        : ex.defaultWeightKg != null
          ? ex.defaultWeightKg
          : null;
    const r = (setsArr[0] && setsArr[0].reps) ? setsArr[0].reps : (ex.defaultReps || "10회");
    const isComp = !!rec.isCompleted || (doneSets >= totalSets && totalSets > 0);

    return {
      id: ex.id,
      name: ex.name,
      mode: ex.mode || "home",
      category: ex.category || "근력",
      equipment: ex.equipment || "맨몸/소도구",
      targetMuscle: ex.targetMuscle || "전신",
      plannedSets: ex.defaultSets || totalSets,
      plannedReps: ex.defaultReps || r,
      plannedWeightKg: ex.defaultWeightKg != null ? ex.defaultWeightKg : null,
      completedSets: doneSets,
      actualWeightKg: w,
      rpe: rec.rpe != null ? rec.rpe : null,
      isCompleted: isComp,
      preference: rec.preference || "neutral",
      preferenceNote: rec.preferenceNote || "",
      ...(ex.swappedFrom ? { swappedFrom: ex.swappedFrom, swapReason: ex.swapReason || "variation" } : {}),
      setLogs: setsArr.map((s, idx) => ({
        set: idx + 1,
        weightKg: s.weightKg != null ? s.weightKg : w,
        reps: s.reps || r,
        done: !!s.done
      }))
    };
  });

  const routineDate = (state.todayRoutine && state.todayRoutine.date) || targetDate;

  return {
    savedAt: nowIso,
    date: targetDate,
    routineDate,
    timestamp: nowIso,
    mode: state.todayRoutine ? state.todayRoutine.mode : "home",
    preset: state.preset,
    routineTitle: state.todayRoutine ? state.todayRoutine.title : "오늘의 추천 루틴",
    bodyCondition: state.bodyCondition || { status: "ok", painAreas: [], updatedAt: "" },
    dislikedExercises: Array.isArray(state.dislikedExercises) ? state.dislikedExercises.slice() : [],
    summary: {
      totalExercises: items.length,
      completedExercises: routineItems.filter(e => e.isCompleted).length,
      totalSets: routineItems.reduce((a, e) => a + (e.plannedSets || (e.setLogs && e.setLogs.length) || 0), 0),
      completedSets: routineItems.reduce((a, e) => a + e.completedSets, 0)
    },
    exercises: routineItems,
    items: routineItems
  };
}

/**
 * Safely updates today's history entry without ever duplicating yesterday's routine
 * into a new calendar day before today's workout actually starts.
 */
export function upsertTodayHistory(store, today = getTodayStr()) {
  const state = store.state;
  if (!Array.isArray(state.history)) state.history = [];

  const routineDate = state.todayRoutine && state.todayRoutine.date ? state.todayRoutine.date : "";
  const userInteractedToday = state.interactedDate === today;

  // Guard 1: If routineDate is strictly older than today AND user hasn't explicitly interacted today,
  // do NOT synthesize a fake history entry for today out of yesterday's routine.
  if (routineDate && routineDate < today && !userInteractedToday) {
    return buildWorkoutLogPayload(store, routineDate);
  }

  const payloadLog = buildWorkoutLogPayload(store, today);
  const currentExercises = payloadLog.exercises || [];

  const idx = state.history.findIndex(h => h && h.date === today);
  if (idx >= 0) {
    const existing = state.history[idx] || {};
    if (currentExercises.length === 0 && Array.isArray(existing.exercises) && existing.exercises.length > 0) {
      payloadLog.exercises = existing.exercises;
      payloadLog.items = existing.exercises;
      if (existing.summary) payloadLog.summary = existing.summary;
    }
    state.history[idx] = Object.assign({}, existing, payloadLog, {
      date: today,
      routineDate: payloadLog.routineDate,
      timestamp: payloadLog.timestamp,
      savedAt: payloadLog.savedAt,
      exercises: payloadLog.exercises,
      items: payloadLog.exercises
    });
  } else if (currentExercises.length > 0) {
    state.history.push(
      Object.assign({}, payloadLog, {
        date: today,
        routineDate: payloadLog.routineDate,
        timestamp: payloadLog.timestamp,
        savedAt: payloadLog.savedAt,
        exercises: currentExercises,
        items: currentExercises
      })
    );
  }

  return payloadLog;
}

/**
 * Merges incoming Drive payload into local store without re-polluting reset today sets
 * with yesterday's completion flags.
 */
export function applyLoadedDriveData(store, data, options = {}) {
  const { silent = false, onUpdated = null, onBadge = null, onStatus = null, onToast = null, today = getTodayStr() } = options;
  const state = store.state;

  if (!data || !data.ok) {
    if (onStatus) onStatus("❌ 드라이브 데이터가 올바르지 않습니다.", true);
    if (!silent && onToast) onToast("❌ 드라이브 불러오기 실패: 유효하지 않은 데이터");
    return false;
  }

  // First ensure local session date reflects today before merging
  store.ensureCurrentSessionDate(today);

  // Merge history cleanly (preserve richer/newer local today if Drive hasn't caught up)
  if (Array.isArray(data.history)) {
    const localToday = state.history.find(h => h && h.date === today);
    const incomingToday = data.history.find(h => h && h.date === today);
    const merged = data.history.slice();

    if (localToday && state.interactedDate === today) {
      const localSets = (localToday.summary && localToday.summary.completedSets) || 0;
      const incSets = (incomingToday && incomingToday.summary && incomingToday.summary.completedSets) || 0;
      const localTime = localToday.savedAt ? new Date(localToday.savedAt).getTime() : 0;
      const incTime = incomingToday && incomingToday.savedAt ? new Date(incomingToday.savedAt).getTime() : 0;
      if (!incomingToday || localSets > incSets || localTime > incTime) {
        const repIdx = merged.findIndex(h => h && h.date === today);
        if (repIdx >= 0) merged[repIdx] = localToday;
        else merged.push(localToday);
      }
    }
    state.history = merged;
  }

  if (Array.isArray(data.customExercises) && data.customExercises.length > 0) {
    state.customExercises = data.customExercises;
  }

  // Apply todayRoutine before checking records so we know today's routine date & items
  let routineChangedToNewerDate = false;
  if (data.todayRoutine && data.todayRoutine.date) {
    const curDate = state.todayRoutine && state.todayRoutine.date ? state.todayRoutine.date : "";
    if (!curDate || data.todayRoutine.date >= curDate) {
      if (curDate && data.todayRoutine.date > curDate) {
        routineChangedToNewerDate = true;
      }
      state.todayRoutine = data.todayRoutine;
    }
  }

  // Reconcile records safely:
  // Always inherit progressive-overload weights, reps, preference, preferenceNote from Drive,
  // but ONLY inherit `done` / `isCompleted` / `rpe` if those flags genuinely belong to TODAY!
  if (data.records && typeof data.records === "object") {
    const todayHist = (state.history || []).find(h => h && h.date === today);
    const todayHistExMap = {};
    if (todayHist && Array.isArray(todayHist.exercises)) {
      todayHist.exercises.forEach(e => {
        if (e && e.id) todayHistExMap[e.id] = e;
      });
    }

    Object.keys(data.records).forEach(exId => {
      const inc = data.records[exId];
      if (!inc || typeof inc !== "object") return;
      const cur = state.records[exId];

      const histEx = todayHistExMap[exId];
      const driveBelongsToToday =
        inc.lastUpdatedDate === today ||
        Boolean(histEx && (histEx.isCompleted || (histEx.completedSets || 0) > 0));

      const localHasTodayProgress =
        cur && cur.lastUpdatedDate === today && ((cur.sets && cur.sets.some(s => s.done)) || cur.isCompleted);

      if (localHasTodayProgress && !driveBelongsToToday) {
        // Keep local today progress, just adopt preference metadata if missing
        cur.preference = cur.preference || inc.preference || null;
        cur.preferenceNote = cur.preferenceNote || inc.preferenceNote || "";
        return;
      }

      if (driveBelongsToToday && !routineChangedToNewerDate) {
        const curDone = cur && Array.isArray(cur.sets) ? cur.sets.filter(s => s.done).length : 0;
        const incDone = Array.isArray(inc.sets) ? inc.sets.filter(s => s.done).length : 0;
        if (!localHasTodayProgress || incDone >= curDone) {
          state.records[exId] = Object.assign({}, inc, {
            sets: Array.isArray(inc.sets) ? inc.sets.map(s => Object.assign({}, s)) : []
          });
        }
      } else {
        // Stale completion from a prior day -> preserve weights/reps/preference, reset done/isCompleted/rpe!
        const nextSets = Array.isArray(inc.sets)
          ? inc.sets.map(s => ({ weightKg: s.weightKg != null ? s.weightKg : 0, reps: s.reps || "10회", done: false }))
          : [];
        if (!cur || cur.lastUpdatedDate !== today) {
          state.records[exId] = {
            sets: nextSets.length > 0 ? nextSets : (cur && cur.sets) || [],
            isCompleted: false,
            rpe: null,
            preference: inc.preference || (cur && cur.preference) || null,
            preferenceNote: inc.preferenceNote || (cur && cur.preferenceNote) || "",
            lastUpdatedDate: (cur && cur.lastUpdatedDate) || ""
          };
        }
      }
    });
  }

  if (routineChangedToNewerDate) {
    store.resetExerciseCompletion(today);
  }

  if (data.workoutExtra !== undefined) state.workoutExtra = data.workoutExtra;
  if (data.wellness) state.wellness = data.wellness;
  if (data.bodyCondition && typeof data.bodyCondition === "object" && !routineChangedToNewerDate) {
    const localTs = (state.bodyCondition && state.bodyCondition.updatedAt) || "";
    const incTs = data.bodyCondition.updatedAt || "";
    if (!localTs || incTs >= localTs) {
      state.bodyCondition = {
        status: data.bodyCondition.status === "pain" && Array.isArray(data.bodyCondition.painAreas) && data.bodyCondition.painAreas.length > 0 ? "pain" : "ok",
        painAreas: Array.isArray(data.bodyCondition.painAreas) ? data.bodyCondition.painAreas.slice() : [],
        updatedAt: incTs
      };
    }
  }
  if (Array.isArray(data.dislikedExercises)) {
    data.dislikedExercises.forEach(eid => {
      if (!state.records[eid]) state.records[eid] = { sets: [], isCompleted: false, rpe: null, preference: "dislike", preferenceNote: "", lastUpdatedDate: "" };
      else if (!state.records[eid].preference) state.records[eid].preference = "dislike";
    });
  }
  if (typeof store.syncDislikedList === "function") store.syncDislikedList();
  if (data.enrichedExercises && data.enrichedExercises.exercises && typeof data.enrichedExercises.exercises === "object") {
    Object.assign(ENRICHED_DB, data.enrichedExercises.exercises);
  }

  // Always compute crisp metrics locally from reconciled history + preserved cycling wellness
  state.metrics = calculateWorkoutMetrics(state.history, state.wellness, { today });
  const hhmm = formatLocalTimeHHMM(new Date());
  state.lastSyncAt = hhmm;
  store.persistState();

  if (onBadge) onBadge(`자동 동기화 ${hhmm}`);
  if (onStatus) onStatus(`☁️ Google Drive 자동 동기화됨 · ${hhmm}`, false);
  if (!silent && onToast) {
    onToast(`📥 ${(state.todayRoutine && state.todayRoutine.date) || "오늘"} 루틴 및 기록 불러오기 완료!`);
  }
  if (onUpdated) onUpdated();
  return true;
}

export function createSyncService(store, uiHooks = {}) {
  let autoPushTimer = null;
  let activeAutoSyncPromise = null;

  async function pushToGoogleDrive(silent = true) {
    store.ensureCurrentSessionDate();
    const state = store.state;
    const payloadLog = upsertTodayHistory(store);
    const metrics = store.refreshMetrics();
    store.persistState();

    if (uiHooks.onMetricsUpdated) uiHooks.onMetricsUpdated(metrics);

    if ((!payloadLog.exercises || payloadLog.exercises.length === 0) && Array.isArray(state.history)) {
      const hToday = state.history.find(h => h && h.date === getTodayStr());
      if (hToday && Array.isArray(hToday.exercises) && hToday.exercises.length > 0) {
        payloadLog.exercises = hToday.exercises;
        payloadLog.items = hToday.exercises;
      }
    }

    const bodyObj = {
      updatedAt: new Date().toISOString(),
      history: state.history,
      records: state.records,
      customExercises: state.customExercises,
      todayRoutine: state.todayRoutine,
      metrics: state.metrics,
      bodyCondition: state.bodyCondition || { status: "ok", painAreas: [], updatedAt: "" },
      dislikedExercises: Array.isArray(state.dislikedExercises) ? state.dislikedExercises.slice() : [],
      log: payloadLog
    };

    if (uiHooks.onBadge) uiHooks.onBadge("동기화 중...");

    const markSuccess = () => {
      const hhmm = formatLocalTimeHHMM(new Date());
      state.lastSyncAt = hhmm;
      store.clearPendingSync();
      if (uiHooks.onBadge) uiHooks.onBadge(`자동 동기화 ${hhmm}`);
      if (uiHooks.onStatus) uiHooks.onStatus(`☁️ Google Drive 자동 동기화됨 · ${hhmm}`, false);
    };

    if (hasGasBridge()) {
      return new Promise(resolve => {
        window.google.script.run
          .withSuccessHandler(res => {
            if (res && res.ok) {
              markSuccess();
              resolve(true);
            } else {
              if (uiHooks.onBadge) uiHooks.onBadge("동기화 실패");
              resolve(false);
            }
          })
          .withFailureHandler(() => {
            if (uiHooks.onBadge) uiHooks.onBadge("동기화 실패");
            resolve(false);
          })
          .saveWorkoutDataFromClient(bodyObj);
      });
    }

    if (!state.gasUrl) {
      if (uiHooks.onBadge) uiHooks.onBadge("URL 미설정");
      return false;
    }

    try {
      const res = await fetch(state.gasUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(bodyObj)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const resData = await res.json();
      if (resData && resData.ok) {
        markSuccess();
        return true;
      }
      if (uiHooks.onBadge) uiHooks.onBadge("동기화 실패");
      return false;
    } catch (err) {
      if (uiHooks.onBadge) uiHooks.onBadge("동기화 오류");
      if (uiHooks.onStatus) uiHooks.onStatus(`❌ 드라이브 저장 오류: ${err.message}`, true);
      return false;
    }
  }

  function scheduleAutoPush(delay = 800) {
    store.markPendingSync();
    if (autoPushTimer) clearTimeout(autoPushTimer);
    autoPushTimer = setTimeout(() => {
      autoPushTimer = null;
      pushToGoogleDrive(true);
    }, delay);
  }

  /**
   * Silent 2-way auto-sync on app launch and foreground resume:
   * 1) Upload any unsynced local changes first if `pendingSync` is set.
   * 2) Pull latest Drive state (todayRoutine, history, wellness, enrichedExercises).
   */
  async function runAutoSync() {
    if (activeAutoSyncPromise) return activeAutoSyncPromise;
    activeAutoSyncPromise = (async () => {
      try {
        store.ensureCurrentSessionDate();
        if (store.state.pendingSync) {
          await pushToGoogleDrive(true);
        }
        return await pullFromGoogleDrive(true);
      } finally {
        activeAutoSyncPromise = null;
      }
    })();
    return activeAutoSyncPromise;
  }

  async function pullFromGoogleDrive(silent = false) {
    if (!silent && uiHooks.onToast) uiHooks.onToast("📥 드라이브에서 최신 루틴 불러오는 중...");
    const state = store.state;

    if (hasGasBridge()) {
      return new Promise(resolve => {
        window.google.script.run
          .withSuccessHandler(data => {
            const ok = applyLoadedDriveData(store, data, {
              silent,
              onUpdated: uiHooks.onLoaded,
              onBadge: uiHooks.onBadge,
              onStatus: uiHooks.onStatus,
              onToast: uiHooks.onToast
            });
            resolve(ok);
          })
          .withFailureHandler(err => {
            const msg = (err && err.message) || "불러오기 오류";
            if (uiHooks.onStatus) uiHooks.onStatus(`❌ 드라이브 불러오기 실패: ${msg}`, true);
            if (!silent && uiHooks.onToast) uiHooks.onToast("❌ 드라이브 불러오기 실패");
            resolve(false);
          })
          .loadWorkoutDataForClient();
      });
    }

    if (!state.gasUrl) {
      if (!silent && uiHooks.onToast) uiHooks.onToast("⚠️ Apps Script URL을 먼저 설정해 주세요.");
      return false;
    }

    try {
      const res = await fetch(`${state.gasUrl}?action=load`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return applyLoadedDriveData(store, data, {
        silent,
        onUpdated: uiHooks.onLoaded,
        onBadge: uiHooks.onBadge,
        onStatus: uiHooks.onStatus,
        onToast: uiHooks.onToast
      });
    } catch (err) {
      if (uiHooks.onStatus) uiHooks.onStatus(`❌ 드라이브 불러오기 실패: ${err.message}`, true);
      if (!silent && uiHooks.onToast) uiHooks.onToast("❌ 드라이브 불러오기에 실패했습니다.");
      return false;
    }
  }

  return {
    pushToGoogleDrive,
    scheduleAutoPush,
    pullFromGoogleDrive,
    runAutoSync
  };
}
