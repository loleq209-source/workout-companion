/**
 * Central state store, localStorage v9 persistence (with v8 migration),
 * midnight rollover protection, and planned-sets reconciliation.
 */
import { getTodayStr } from "./date.mjs";
import { EXERCISES, getAllExercises, isWarmupOrStretch, resolveExerciseId, getLegacyAliasForNewId } from "./data.mjs";
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
  const today = getTodayStr();

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
    history: Array.isArray(saved && saved.history) ? saved.history : [],
    gasUrl: (saved && saved.gasUrl) || DEFAULT_GAS_URL,
    lastSyncAt: (saved && saved.lastSyncAt) || "",
    pendingSync: Boolean(saved && saved.pendingSync),
    records: (saved && saved.records && typeof saved.records === "object") ? saved.records : {},
    sessionDate: (saved && saved.sessionDate) || today,
    interactedDate: (saved && saved.interactedDate) || ""
  };

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
          metrics: state.metrics
        })
      );
    } catch (e) {}
  }

  function resetExerciseCompletion(newDate = getTodayStr()) {
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
    persistState();
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
            reason: it.reason || ""
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
          reason: it.reason || ""
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

  function addExerciseToTodayRoutine(exId) {
    const all = getAllExercises(state.customExercises);
    const ex = all.find(x => x.id === exId);
    if (!ex) return -1;

    const existingItems = getTodayRoutineExercises();
    const existingIdx = existingItems.findIndex(x => x.id === exId);
    if (existingIdx !== -1) return existingIdx;

    if (!state.todayRoutine) {
      state.todayRoutine = {
        date: getTodayStr(),
        title: "오늘의 맞춤 운동 루틴",
        note: "사용자가 구성한 오늘의 루틴입니다.",
        mode: ex.mode || "home",
        items: existingItems.map(x => ({
          id: x.id,
          label: x.name,
          sets: x.defaultSets,
          reps: x.defaultReps,
          restSec: x.restSec || 60
        }))
      };
    }

    if (Array.isArray(state.todayRoutine.items)) {
      state.todayRoutine.items.push({
        id: ex.id,
        label: ex.name,
        sets: ex.defaultSets,
        reps: ex.defaultReps,
        restSec: ex.restSec || 60
      });
    } else {
      if (!Array.isArray(state.extraTodayIds)) state.extraTodayIds = [];
      state.extraTodayIds.push(ex.id);
    }

    markUserInteractedToday();
    persistState();
    return getTodayRoutineExercises().findIndex(x => x.id === ex.id);
  }

  function replaceTodayRoutineExercise(idx, altId) {
    const all = getAllExercises(state.customExercises);
    const altEx = all.find(x => x.id === altId);
    if (!altEx) return false;
    const current = getTodayRoutineExercises();
    if (idx < 0 || idx >= current.length) return false;

    const spec = {
      id: altEx.id,
      label: altEx.name,
      sets: altEx.defaultSets,
      reps: altEx.defaultReps,
      weightKg: altEx.defaultWeightKg,
      restSec: altEx.restSec || 60
    };

    if (state.todayRoutine && Array.isArray(state.todayRoutine.items) && idx < state.todayRoutine.items.length) {
      state.todayRoutine.items[idx] = spec;
    } else {
      const extraIdx = idx - ((state.todayRoutine && Array.isArray(state.todayRoutine.items) && state.todayRoutine.items.length) || 0);
      if (Array.isArray(state.extraTodayIds) && extraIdx >= 0 && extraIdx < state.extraTodayIds.length) {
        state.extraTodayIds[extraIdx] = altEx.id;
      }
    }
    markUserInteractedToday();
    persistState();
    return true;
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

  function getLastRecord(exId, exName = "") {
    if (!Array.isArray(state.history) || state.history.length === 0) return null;
    const legacyId = getLegacyAliasForNewId(exId);
    for (let i = state.history.length - 1; i >= 0; i--) {
      const sess = state.history[i];
      if (!sess) continue;
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
    getRecord,
    getTodayRoutineExercises,
    addExerciseToTodayRoutine,
    replaceTodayRoutineExercise,
    getFilteredCatalogExercises,
    getLastRecord,
    refreshMetrics
  };
}
