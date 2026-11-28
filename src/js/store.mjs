/**
 * Central state store, localStorage v9 persistence (with v8 migration),
 * midnight rollover protection, and planned-sets reconciliation.
 */
import { getTodayStr, getWorkoutDateStr } from "./date.mjs";
import { EXERCISES, getAllExercises, isWarmupOrStretch, resolveExerciseId, getLegacyAliasForNewId, findPainAlertAlternative } from "./data.mjs";
import { pickModeConversionTarget } from "./swapEngine.mjs";
import { calculateWorkoutMetrics } from "./metrics.mjs";

const STORAGE_KEY_V9 = "workout_companion_state_v9";
const STORAGE_KEY_V8 = "workout_companion_state_v8";
const DEFAULT_GAS_URL =
  "https://script.google.com/macros/s/AKfycbx_G6I87XVRA3LaP1vUOvn_wHHKPc8vZ4QF-dPj8uVwl6p-Phl9kGGnhgOiUc1MmgzH/exec";

function loadSavedRaw(storage = typeof localStorage !== "undefined" ? localStorage : null) {
  if (!storage) return null;
  try {
    const rawV9 = storage.getItem(STORAGE_KEY_V9);
    if (rawV9) return JSON.parse(rawV9);
    const rawV8 = storage.getItem(STORAGE_KEY_V8);
    if (rawV8) return JSON.parse(rawV8);
  } catch (e) {}
  return null;
}

export function createStore(storage = typeof localStorage !== "undefined" ? localStorage : null) {
  const saved = loadSavedRaw(storage);
  const today = getWorkoutDateStr();

  const state = {
    activeTab: (saved && saved.activeTab) || "today", // "today" | "catalog" | "sync"
    todayScreen: "dashboard", // "dashboard" | "card"
    todayCardIndex: 0,
    mode: (saved && saved.mode) || "home", // "home" | "gym" | "all"
    preset: (saved && saved.preset) || "all_catalog",
    searchQuery: "",
    catalogFilter: (saved && saved.catalogFilter) || "all", // "all" | "like" | "dislike" | "completed"
    soundEnabled: saved && typeof saved.soundEnabled === "boolean" ? saved.soundEnabled : true,
    customExercises: Array.isArray(saved && saved.customExercises) ? saved.customExercises : [],
    todayRoutine: (saved && saved.todayRoutine) || null,
    extraTodayIds: Array.isArray(saved && saved.extraTodayIds) ? saved.extraTodayIds : [],
    workoutExtra: (saved && saved.workoutExtra) || null,
    wellness: (saved && saved.wellness) || null,
    metrics: (saved && saved.metrics) || null,
    bodyCondition:
      saved && saved.bodyCondition && typeof saved.bodyCondition === "object"
        ? {
            status: saved.bodyCondition.status === "pain" && Array.isArray(saved.bodyCondition.painAreas) && saved.bodyCondition.painAreas.length > 0 ? "pain" : "ok",
            painAreas: Array.isArray(saved.bodyCondition.painAreas) ? saved.bodyCondition.painAreas.slice() : [],
            updatedAt: saved.bodyCondition.updatedAt || ""
          }
        : { status: "ok", painAreas: [], updatedAt: "" },
    history: Array.isArray(saved && saved.history) ? saved.history : [],
    dislikedExercises: Array.isArray(saved && saved.dislikedExercises) ? saved.dislikedExercises.slice() : [],
    gasUrl: (saved && saved.gasUrl) || DEFAULT_GAS_URL,
    lastSyncAt: (saved && saved.lastSyncAt) || "",
    pendingSync: Boolean(saved && saved.pendingSync),
    records: (saved && saved.records && typeof saved.records === "object") ? saved.records : {},
    sessionDate: (saved && saved.sessionDate) || today,
    interactedDate: (saved && saved.interactedDate) || ""
  };

  function syncDislikedList() {
    const set = new Set();
    Object.keys(state.records || {}).forEach(k => {
      if (state.records[k] && state.records[k].preference === "dislike") {
        set.add(resolveExerciseId(k));
      }
    });
    state.dislikedExercises = [...set];
    return state.dislikedExercises;
  }
  // Hydrate initial dislikedExercises from both saved array & records
  if (Array.isArray(state.dislikedExercises)) {
    state.dislikedExercises.forEach(id => {
      const resId = resolveExerciseId(id);
      if (resId && state.records[resId] && !state.records[resId].preference) {
        state.records[resId].preference = "dislike";
      }
    });
  }
  syncDislikedList();

  // Validate preset id against known catalog presets
  if (!["all_catalog", "today_ai", "warmup", "upper_core", "lower_core", "riding_recovery", "custom"].includes(state.preset)) {
    state.preset = "all_catalog";
  }

  function persistState() {
    if (!storage) return;
    try {
      storage.setItem(
        STORAGE_KEY_V9,
        JSON.stringify({
          activeTab: state.activeTab,
          mode: state.mode,
          preset: state.preset,
          catalogFilter: state.catalogFilter,
          soundEnabled: state.soundEnabled,
          gasUrl: state.gasUrl,
          lastSyncAt: state.lastSyncAt,
          pendingSync: state.pendingSync,
          records: state.records,
          sessionDate: state.sessionDate,
          interactedDate: state.interactedDate,
          history: state.history,
          customExercises: state.customExercises,
          todayRoutine: state.todayRoutine,
          extraTodayIds: state.extraTodayIds,
          workoutExtra: state.workoutExtra,
          wellness: state.wellness,
          metrics: state.metrics,
          bodyCondition: state.bodyCondition,
          dislikedExercises: state.dislikedExercises
        })
      );
    } catch (e) {}
  }

  function setExercisePreference(exId, nextPref) {
    if (!exId) return false;
    const resId = resolveExerciseId(exId);
    const all = getAllExercises(state.customExercises);
    const ex = all.find(x => x.id === resId) || { id: resId };
    const rec = getRecord(ex);
    rec.preference = nextPref || null;
    syncDislikedList();
    markPendingSync();
    persistState();
    return rec.preference === "dislike";
  }

  function resetExerciseCompletion(newDate = getWorkoutDateStr()) {
    if (!state.records) state.records = {};
    Object.keys(state.records).forEach(k => {
      const r = state.records[k];
      if (r && typeof r === "object") {
        r.isCompleted = false;
        r.rpe = null;
        if (Array.isArray(r.sets)) {
          r.sets.forEach(s => { s.done = false; });
        }
      }
    });
    state.extraTodayIds = [];
    state.todayCardIndex = 0;
    state.sessionDate = newDate;
    state.bodyCondition = { status: "ok", painAreas: [], updatedAt: "" };
    persistState();
  }

  function setBodyCondition(painAreas = []) {
    const clean = Array.isArray(painAreas) ? [...new Set(painAreas.filter(Boolean))] : [];
    state.bodyCondition = {
      status: clean.length > 0 ? "pain" : "ok",
      painAreas: clean,
      updatedAt: new Date().toISOString()
    };
    markUserInteractedToday();
    persistState();
    return state.bodyCondition;
  }

  /**
   * Detects calendar date change both at startup AND if the app stays open across midnight.
   * Returns true if a rollover reset occurred.
   */
  function ensureCurrentSessionDate(currentToday = getTodayStr()) {
    if (state.sessionDate && state.sessionDate !== currentToday) {
      resetExerciseCompletion(currentToday);
      return true;
    }
    state.sessionDate = currentToday;
    return false;
  }

  function markUserInteractedToday(currentToday = getTodayStr()) {
    state.sessionDate = currentToday;
    state.interactedDate = currentToday;
    state.pendingSync = true;
  }

  function markPendingSync() {
    state.pendingSync = true;
    persistState();
  }

  function clearPendingSync() {
    state.pendingSync = false;
    persistState();
  }

  /**
   * Retrieves and reconciles an exercise record so plannedSets & new-day reps
   * never stay permanently stale while preserving progressive-overload weightKg & preferences.
   */
  function getRecord(ex, currentToday = getTodayStr()) {
    if (!ex || !ex.id) return { sets: [], isCompleted: false, rpe: null, preference: null, preferenceNote: "" };
    const targetSets = Math.max(1, Number(ex.defaultSets) || 3);
    const targetReps = ex.defaultReps || "10회";
    const fallbackWeight = typeof ex.defaultWeightKg === "number" ? ex.defaultWeightKg : 0;

    let rec = state.records[ex.id];
    if (!rec) {
      const legacyId = getLegacyAliasForNewId(ex.id);
      const legacyRec = legacyId && state.records[legacyId];
      if (legacyRec && Array.isArray(legacyRec.sets) && legacyRec.sets.length > 0) {
        rec = {
          sets: legacyRec.sets.map(s => ({
            weightKg: s.weightKg != null ? s.weightKg : fallbackWeight,
            reps: s.reps || targetReps,
            done: legacyRec.lastUpdatedDate === currentToday ? !!s.done : false
          })),
          isCompleted: legacyRec.lastUpdatedDate === currentToday ? !!legacyRec.isCompleted : false,
          rpe: legacyRec.lastUpdatedDate === currentToday ? (legacyRec.rpe ?? null) : null,
          preference: legacyRec.preference || null,
          preferenceNote: legacyRec.preferenceNote || "",
          lastUpdatedDate: legacyRec.lastUpdatedDate || ""
        };
        state.records[ex.id] = rec;
      }
    }
    if (!rec || !Array.isArray(rec.sets) || rec.sets.length === 0) {
      const sets = [];
      for (let i = 0; i < targetSets; i++) {
        sets.push({ weightKg: fallbackWeight, reps: targetReps, done: false });
      }
      rec = {
        sets,
        isCompleted: false,
        rpe: null,
        preference: (rec && rec.preference) || null,
        preferenceNote: (rec && rec.preferenceNote) || "",
        lastUpdatedDate: currentToday
      };
      state.records[ex.id] = rec;
      return rec;
    }

    const doneCount = rec.sets.filter(s => s && s.done).length;

    // On a new untouched day, align target reps & routine-prescribed weight cleanly to today's prescription
    if (doneCount === 0 && !rec.isCompleted && rec.lastUpdatedDate !== currentToday) {
      rec.sets.forEach(s => {
        s.reps = targetReps;
        if (typeof ex.routineWeightKg === "number") {
          s.weightKg = ex.routineWeightKg;
        } else if (s.weightKg == null || (s.weightKg === 0 && fallbackWeight > 0)) {
          s.weightKg = fallbackWeight;
        }
      });
    }

    // Reconcile set count with current routine prescription without wiping completed sets
    if (rec.sets.length < targetSets) {
      const sample = rec.sets[rec.sets.length - 1] || { weightKg: fallbackWeight, reps: targetReps };
      while (rec.sets.length < targetSets) {
        rec.sets.push({
          weightKg: sample.weightKg != null ? sample.weightKg : fallbackWeight,
          reps: sample.reps || targetReps,
          done: false
        });
      }
      if (rec.isCompleted) rec.isCompleted = rec.sets.every(s => s.done);
    } else if (rec.sets.length > targetSets && doneCount <= targetSets && !rec.isCompleted) {
      // Drop trailing unchecked sets to match plannedSets
      while (rec.sets.length > targetSets && !rec.sets[rec.sets.length - 1].done) {
        rec.sets.pop();
      }
      if (rec.sets.length > 0 && rec.sets.every(s => s.done)) {
        rec.isCompleted = true;
      }
    }

    return rec;
  }

  function getTodayRoutineExercises() {
    const all = getAllExercises(state.customExercises);
    const list = [];
    const seen = new Set();

    const addItemFromSpec = (it) => {
      if (!it || !it.id) return;
      const resolvedId = resolveExerciseId(it.id);
      if (seen.has(resolvedId)) return;
      seen.add(resolvedId);
      const found = all.find(x => x.id === resolvedId);
      const hasRoutineWeight = typeof it.weightKg === "number";
      if (found) {
        list.push(
          Object.assign({}, found, {
            defaultSets: it.sets || found.defaultSets,
            defaultReps: it.reps || found.defaultReps,
            defaultWeightKg: hasRoutineWeight ? it.weightKg : found.defaultWeightKg,
            routineWeightKg: hasRoutineWeight ? it.weightKg : null,
            restSec: it.restSec || found.restSec,
            reason: it.reason || "",
            isExtra: !!it.isExtra,
            extraReason: it.extraReason || "",
            swappedFrom: it.swappedFrom || null,
            swapReason: it.swapReason || null,
            undoItem: it.undoItem || null,
            doneOffsetSets: it.doneOffsetSets || 0
          })
        );
      } else {
        list.push({
          id: resolvedId,
          name: it.label || it.name || resolvedId,
          mode: (state.todayRoutine && state.todayRoutine.mode) || "home",
          category: it.category || "근력",
          equipment: it.equipment || "맨몸/소도구",
          targetMuscle: it.targetMuscle || "전신",
          defaultSets: it.sets || 3,
          defaultReps: it.reps || "10회",
          defaultWeightKg: hasRoutineWeight ? it.weightKg : 0,
          routineWeightKg: hasRoutineWeight ? it.weightKg : null,
          restSec: it.restSec || 60,
          reason: it.reason || "",
          isExtra: !!it.isExtra,
          extraReason: it.extraReason || "",
          swappedFrom: it.swappedFrom || null,
          swapReason: it.swapReason || null,
          undoItem: it.undoItem || null,
          doneOffsetSets: it.doneOffsetSets || 0
        });
      }
    };

    if (state.todayRoutine && Array.isArray(state.todayRoutine.items) && state.todayRoutine.items.length > 0) {
      state.todayRoutine.items.forEach(addItemFromSpec);
    } else {
      all.filter(x => x.mode === "home").slice(0, 7).forEach(ex => addItemFromSpec({ id: ex.id }));
    }

    // Also include extra exercises added today from Catalog tab
    (state.extraTodayIds || []).forEach(extraId => {
      addItemFromSpec({ id: extraId });
    });

    return list;
  }

  function addExerciseToTodayRoutine(exId, overrides = null) {
    const all = getAllExercises(state.customExercises);
    const ex = all.find(x => x.id === exId);
    if (!ex) return -1;

    const existingItems = getTodayRoutineExercises();
    const existingIdx = existingItems.findIndex(x => x.id === exId);
    const hasOverrides =
      overrides &&
      (overrides.sets != null ||
        overrides.reps != null ||
        overrides.weightKg != null ||
        overrides.isExtra != null ||
        overrides.extraReason != null);

    if (existingIdx !== -1 && !hasOverrides) return existingIdx;

    if (!state.todayRoutine) {
      state.todayRoutine = {
        date: getWorkoutDateStr(),
        title: "오늘의 맞춤 운동 루틴",
        note: "사용자가 구성한 오늘의 루틴입니다.",
        mode: ex.mode || "home",
        items: existingItems.map(x => ({
          id: x.id,
          label: x.name,
          sets: x.defaultSets,
          reps: x.defaultReps,
          weightKg: typeof x.defaultWeightKg === "number" ? x.defaultWeightKg : undefined,
          restSec: x.restSec || 60,
          ...(x.isExtra ? { isExtra: true, extraReason: x.extraReason || "" } : {})
        }))
      };
    }

    const nextSets = (overrides && Number(overrides.sets)) || ex.defaultSets || 3;
    const nextReps = (overrides && overrides.reps) || ex.defaultReps || "10회";
    const nextWeight =
      overrides && overrides.weightKg != null && !Number.isNaN(Number(overrides.weightKg))
        ? Number(overrides.weightKg)
        : ex.defaultWeightKg;
    const isExtra = overrides && overrides.isExtra !== undefined ? !!overrides.isExtra : true;
    const extraReason = (overrides && overrides.extraReason) || "";

    const newSpec = {
      id: ex.id,
      label: ex.name,
      sets: nextSets,
      reps: nextReps,
      weightKg: typeof nextWeight === "number" ? nextWeight : undefined,
      restSec: ex.restSec || 60,
      reason: (overrides && overrides.reason) || (extraReason ? `${extraReason} 추가 운동` : "오늘 즉석 추가 종목"),
      ...(isExtra ? { isExtra: true, extraReason: extraReason || "직접 선택" } : {})
    };

    if (Array.isArray(state.todayRoutine.items)) {
      const idxInItems = state.todayRoutine.items.findIndex(it => resolveExerciseId(it && it.id) === ex.id);
      if (idxInItems !== -1) {
        state.todayRoutine.items[idxInItems] = Object.assign({}, state.todayRoutine.items[idxInItems], newSpec);
      } else {
        state.todayRoutine.items.push(newSpec);
      }
    } else {
      if (!Array.isArray(state.extraTodayIds)) state.extraTodayIds = [];
      if (!state.extraTodayIds.includes(ex.id)) state.extraTodayIds.push(ex.id);
    }

    if (hasOverrides) {
      const targetW = typeof nextWeight === "number" ? nextWeight : 0;
      const curRec = state.records[ex.id];
      if (!curRec || (!curRec.isCompleted && (!curRec.sets || curRec.sets.every(s => !s.done)))) {
        const setsArr = [];
        for (let i = 0; i < nextSets; i++) {
          setsArr.push({ weightKg: targetW, reps: nextReps, done: false });
        }
        state.records[ex.id] = {
          sets: setsArr,
          isCompleted: false,
          rpe: null,
          preference: (curRec && curRec.preference) || null,
          preferenceNote: (curRec && curRec.preferenceNote) || "",
          lastUpdatedDate: getWorkoutDateStr()
        };
      }
    }

    markUserInteractedToday();
    persistState();
    return getTodayRoutineExercises().findIndex(x => x.id === ex.id);
  }

  function removeExtraExercise(idx) {
    ensureMaterializedRoutine();
    const current = getTodayRoutineExercises();
    if (idx < 0 || idx >= current.length) return false;
    const ex = current[idx];
    if (!ex || !ex.isExtra) return false;
    const rec = getRecord(ex);
    if (rec && rec.isCompleted) return false;

    const itemIdx = state.todayRoutine.items.findIndex(it => resolveExerciseId(it && it.id) === ex.id);
    if (itemIdx !== -1) {
      state.todayRoutine.items.splice(itemIdx, 1);
    }
    if (Array.isArray(state.extraTodayIds)) {
      state.extraTodayIds = state.extraTodayIds.filter(eid => resolveExerciseId(eid) !== ex.id);
    }
    if (state.records && state.records[ex.id] && !state.records[ex.id].isCompleted) {
      const prevRec = state.records[ex.id];
      state.records[ex.id] = {
        sets: (prevRec.sets || []).map(s => ({
          weightKg: s.weightKg != null ? s.weightKg : 0,
          reps: s.reps || ex.defaultReps || "10회",
          done: false
        })),
        isCompleted: false,
        rpe: null,
        preference: prevRec.preference || null,
        preferenceNote: prevRec.preferenceNote || "",
        lastUpdatedDate: ""
      };
    }

    const nextLen = getTodayRoutineExercises().length;
    if (state.todayCardIndex >= nextLen) {
      state.todayCardIndex = Math.max(0, nextLen - 1);
    }
    markUserInteractedToday();
    refreshMetrics();
    persistState();
    return true;
  }

  function ensureMaterializedRoutine() {
    const cur = getTodayRoutineExercises();
    if (!state.todayRoutine || !Array.isArray(state.todayRoutine.items) || state.todayRoutine.items.length === 0) {
      state.todayRoutine = {
        date: getWorkoutDateStr(),
        title: (state.todayRoutine && state.todayRoutine.title) || "오늘의 맞춤 운동 루틴",
        note: (state.todayRoutine && state.todayRoutine.note) || "",
        mode: (state.todayRoutine && state.todayRoutine.mode) || (cur[0] && cur[0].mode) || "home",
        items: cur.map(x => ({
          id: x.id,
          label: x.name,
          sets: x.defaultSets,
          reps: x.defaultReps,
          weightKg: typeof x.defaultWeightKg === "number" ? x.defaultWeightKg : undefined,
          restSec: x.restSec || 60,
          reason: x.reason || "",
          ...(x.isExtra ? { isExtra: true, extraReason: x.extraReason || "" } : {})
        }))
      };
      state.extraTodayIds = [];
    } else if (Array.isArray(state.extraTodayIds) && state.extraTodayIds.length > 0) {
      const existing = new Set(state.todayRoutine.items.map(it => resolveExerciseId(it && it.id)));
      const all = getAllExercises(state.customExercises);
      state.extraTodayIds.forEach(eid => {
        const resId = resolveExerciseId(eid);
        if (existing.has(resId)) return;
        const found = all.find(x => x.id === resId);
        if (found) {
          existing.add(resId);
          state.todayRoutine.items.push({
            id: found.id,
            label: found.name,
            sets: found.defaultSets,
            reps: found.defaultReps,
            weightKg: typeof found.defaultWeightKg === "number" ? found.defaultWeightKg : undefined,
            restSec: found.restSec || 60
          });
        }
      });
      state.extraTodayIds = [];
    }
    return state.todayRoutine.items;
  }

  function replaceTodayRoutineExercise(idx, altId, swapReason = "variation") {
    const all = getAllExercises(state.customExercises);
    const resolvedAlt = resolveExerciseId(altId);
    const altEx = all.find(x => x.id === resolvedAlt);
    if (!altEx) return false;

    const current = getTodayRoutineExercises();
    if (idx < 0 || idx >= current.length) return false;
    const oldEx = current[idx];
    if (oldEx && oldEx.id === altEx.id) return false;

    const itemsArr = ensureMaterializedRoutine();
    const prevItem = itemsArr[idx] || { id: oldEx.id, label: oldEx.name };

    // 1. Check partial set completion on old exercise & preserve it in state.records
    const todayDate = getWorkoutDateStr();
    const oldRec = getRecord(oldEx, todayDate);
    const oldDoneCount = Array.isArray(oldRec.sets) ? oldRec.sets.filter(s => s && s.done).length : 0;

    // 2. Determine optimal weight from prior history (or altEx defaults)
    const prevHist = getLastRecord(altEx.id, altEx.name, todayDate);
    let targetWeight = typeof altEx.defaultWeightKg === "number" ? altEx.defaultWeightKg : null;
    if (prevHist && prevHist.data) {
      const histW = prevHist.data.actualWeightKg ?? prevHist.data.plannedWeightKg;
      if (typeof histW === "number" && histW > 0) targetWeight = histW;
    }

    const baseSets = altEx.defaultSets || 3;
    const remainingSets = oldDoneCount > 0 ? Math.max(1, baseSets - oldDoneCount) : baseSets;
    const targetReps = (prevHist && prevHist.data && prevHist.data.plannedReps) || altEx.defaultReps || "10회";
    const originalId = prevItem.swappedFrom || prevItem.id;
    const undoItem = prevItem.undoItem ? Object.assign({}, prevItem.undoItem) : Object.assign({}, prevItem);
    const reasonTag =
      swapReason === "pain" ? "통증 안전 대체" : swapReason === "gym_switch" ? "장소·기구 전환" : "다른 자극 교체";

    itemsArr[idx] = {
      id: altEx.id,
      label: altEx.name,
      sets: remainingSets,
      reps: targetReps,
      weightKg: typeof targetWeight === "number" ? targetWeight : undefined,
      restSec: altEx.restSec || 60,
      reason: reasonTag,
      swappedFrom: originalId,
      swapReason,
      undoItem,
      doneOffsetSets: oldDoneCount
    };

    // Reconcile replacement record cleanly if not yet done today
    const curAltRec = state.records[altEx.id];
    const altAlreadyHasDoneToday = curAltRec && curAltRec.lastUpdatedDate === todayDate && curAltRec.sets && curAltRec.sets.some(s => s.done);
    if (!altAlreadyHasDoneToday) {
      const setsArr = [];
      for (let i = 0; i < remainingSets; i++) {
        setsArr.push({ weightKg: typeof targetWeight === "number" ? targetWeight : 0, reps: targetReps, done: false });
      }
      state.records[altEx.id] = {
        sets: setsArr,
        isCompleted: false,
        rpe: null,
        preference: (curAltRec && curAltRec.preference) || null,
        preferenceNote: (curAltRec && curAltRec.preferenceNote) || "",
        lastUpdatedDate: curAltRec && curAltRec.lastUpdatedDate ? curAltRec.lastUpdatedDate : ""
      };
    }

    markUserInteractedToday();
    persistState();
    return true;
  }

  function undoRoutineSwap(idx) {
    if (!state.todayRoutine || !Array.isArray(state.todayRoutine.items)) return false;
    const item = state.todayRoutine.items[idx];
    if (!item || !item.undoItem) return false;
    const restored = Object.assign({}, item.undoItem);
    delete restored.swappedFrom;
    delete restored.swapReason;
    delete restored.undoItem;
    delete restored.doneOffsetSets;
    state.todayRoutine.items[idx] = restored;
    markUserInteractedToday();
    persistState();
    return true;
  }

  function getRoutineEffectiveMode() {
    const items = getTodayRoutineExercises();
    let gymCount = 0;
    let homeCount = 0;
    for (const ex of items) {
      if (isWarmupOrStretch(ex)) continue;
      if (ex.mode === "gym") gymCount++;
      else homeCount++;
    }
    if (gymCount > homeCount) return "gym";
    if (homeCount > gymCount) return "home";
    return (state.todayRoutine && state.todayRoutine.mode === "gym") ? "gym" : "home";
  }

  function toggleRoutineMode() {
    ensureMaterializedRoutine();
    const current = getTodayRoutineExercises();
    const curMode = getRoutineEffectiveMode();
    const targetMode = curMode === "gym" ? "home" : "gym";
    const todayDate = getWorkoutDateStr();

    // Check if we can cleanly revert a prior mode conversion
    const backup = state.todayRoutine && state.todayRoutine.modeBackup;
    if (backup && backup.targetMode === curMode && backup.fromMode === targetMode && Array.isArray(backup.items)) {
      let revertedCount = 0;
      for (let i = 0; i < current.length; i++) {
        const rec = getRecord(current[i], todayDate);
        if (rec.isCompleted) continue;
        const spec = state.todayRoutine.items[i];
        if (spec && spec.swapReason === "gym_switch" && spec.undoItem) {
          undoRoutineSwap(i);
          revertedCount++;
        }
      }
      state.todayRoutine.mode = targetMode;
      delete state.todayRoutine.modeBackup;
      markUserInteractedToday();
      persistState();
      return { convertedCount: revertedCount, targetMode, reverted: true };
    }

    state.todayRoutine.modeBackup = {
      fromMode: curMode,
      targetMode,
      items: state.todayRoutine.items.map(it => Object.assign({}, it))
    };

    const usedIds = new Set();
    current.forEach(ex => {
      const rec = getRecord(ex, todayDate);
      if (rec.isCompleted || isWarmupOrStretch(ex) || ex.mode === targetMode) {
        usedIds.add(ex.id);
      }
    });

    let convertedCount = 0;
    for (let i = 0; i < current.length; i++) {
      const ex = current[i];
      const rec = getRecord(ex, todayDate);
      if (rec.isCompleted || isWarmupOrStretch(ex) || ex.mode === targetMode) continue;
      const targetEx = pickModeConversionTarget(ex, targetMode, usedIds, state.customExercises);
      if (targetEx) {
        usedIds.add(targetEx.id);
        if (replaceTodayRoutineExercise(i, targetEx.id, "gym_switch")) {
          convertedCount++;
        }
      }
    }

    state.todayRoutine.mode = targetMode;
    markUserInteractedToday();
    persistState();
    return { convertedCount, targetMode, reverted: false };
  }

  function bulkReplacePainExercises(painAreas = []) {
    if (!Array.isArray(painAreas) || painAreas.length === 0) return 0;
    ensureMaterializedRoutine();
    const current = getTodayRoutineExercises();
    const todayDate = getWorkoutDateStr();
    let count = 0;
    for (let i = 0; i < current.length; i++) {
      const ex = current[i];
      const rec = getRecord(ex, todayDate);
      if (rec.isCompleted) continue;
      const alt = findPainAlertAlternative(ex, painAreas);
      if (alt && replaceTodayRoutineExercise(i, alt.altId, "pain")) {
        count++;
      }
    }
    return count;
  }

  function getFilteredCatalogExercises() {
    let list = getAllExercises(state.customExercises);

    // 1. Mode filter ("home" | "gym" | "all")
    if (state.mode !== "all") {
      list = list.filter(x => x.mode === state.mode);
    }

    // 2. Preset chip filter (actually wired!)
    const preset = state.preset || "all_catalog";
    if (preset === "today_ai") {
      const todayIds = new Set(getTodayRoutineExercises().map(x => x.id));
      list = list.filter(x => todayIds.has(x.id));
    } else if (preset === "warmup") {
      list = list.filter(x => isWarmupOrStretch(x) || (x.presets && x.presets.includes("warmup")));
    } else if (preset === "upper_core") {
      list = list.filter(
        x =>
          (x.presets && x.presets.includes("upper_core")) ||
          (x.category && (x.category.includes("상체") || x.category.includes("밀기") || x.category.includes("당기기") || x.category.includes("코어")))
      );
    } else if (preset === "lower_core") {
      list = list.filter(
        x =>
          (x.presets && x.presets.includes("lower_core")) ||
          (x.category && (x.category.includes("하체") || x.category.includes("코어")))
      );
    } else if (preset === "riding_recovery") {
      list = list.filter(x => x.presets && x.presets.includes("riding_recovery"));
    } else if (preset === "custom") {
      list = list.filter(x => String(x.id).startsWith("custom_"));
    }

    // 3. Preference / Completion filter
    if (state.catalogFilter === "like") {
      list = list.filter(x => (state.records[x.id] && state.records[x.id].preference) === "like");
    } else if (state.catalogFilter === "dislike") {
      list = list.filter(x => (state.records[x.id] && state.records[x.id].preference) === "dislike");
    } else if (state.catalogFilter === "completed") {
      list = list.filter(x => state.records[x.id] && state.records[x.id].isCompleted);
    }

    // 4. Text search
    if (state.searchQuery && state.searchQuery.trim()) {
      const q = state.searchQuery.trim().toLowerCase();
      list = list.filter(
        x =>
          (x.name || "").toLowerCase().includes(q) ||
          (x.targetMuscle || "").toLowerCase().includes(q) ||
          (x.equipment || "").toLowerCase().includes(q) ||
          (x.category || "").toLowerCase().includes(q)
      );
    }

    return list;
  }

  function getLastRecord(exId, exName = "", beforeDate = getWorkoutDateStr()) {
    if (!Array.isArray(state.history) || state.history.length === 0) return null;
    const legacyId = getLegacyAliasForNewId(exId);
    for (let i = state.history.length - 1; i >= 0; i--) {
      const sess = state.history[i];
      if (!sess || !sess.date) continue;
      if (beforeDate && sess.date >= beforeDate) continue;
      const exArr = sess.exercises || sess.items || [];
      const found = exArr.find(
        item =>
          (item.id === exId || (legacyId && item.id === legacyId) || (exName && item.name === exName)) &&
          (item.isCompleted || (item.completedSets || 0) > 0)
      );
      if (found) return { date: sess.date, data: found };
    }
    return null;
  }

  function refreshMetrics() {
    state.metrics = calculateWorkoutMetrics(state.history, state.wellness);
    return state.metrics;
  }

  // Run rollover check immediately upon store creation
  ensureCurrentSessionDate(today);

  return {
    state,
    persistState,
    resetExerciseCompletion,
    ensureCurrentSessionDate,
    markUserInteractedToday,
    markPendingSync,
    clearPendingSync,
    setBodyCondition,
    syncDislikedList,
    setExercisePreference,
    getRecord,
    getTodayRoutineExercises,
    addExerciseToTodayRoutine,
    removeExtraExercise,
    replaceTodayRoutineExercise,
    undoRoutineSwap,
    getRoutineEffectiveMode,
    toggleRoutineMode,
    bulkReplacePainExercises,
    getFilteredCatalogExercises,
    getLastRecord,
    refreshMetrics
  };
}
