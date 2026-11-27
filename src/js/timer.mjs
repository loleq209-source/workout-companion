/**
 * Wall-clock accurate rest timer (drift-free across background / screen lock).
 */
import { triggerNativeTimer, cancelNativeTimer, triggerCompletionFeedback, triggerNativeHaptic, playCountdownBeep } from "./bridge.mjs";

export function createTimerController(store, callbacks = {}) {
  const timer = {
    exerciseId: null,
    duration: 60,
    remaining: 60,
    endTimestamp: 0,
    running: false,
    intervalId: null,
    label: "휴식"
  };

  function emitTick() {
    if (typeof callbacks.onTick === "function") callbacks.onTick(timer);
  }

  function emitComplete(completedLabel) {
    if (typeof callbacks.onComplete === "function") callbacks.onComplete(completedLabel, timer);
  }

  function syncWithClock() {
    if (!timer.running || !timer.endTimestamp) return false;
    const rem = Math.max(0, Math.ceil((timer.endTimestamp - Date.now()) / 1000));
    timer.remaining = rem;
    if (rem <= 0) {
      clearInterval(timer.intervalId);
      timer.intervalId = null;
      timer.running = false;
      timer.endTimestamp = 0;
      timer.remaining = 0;
      const completedLabel = timer.label;
      emitTick();
      triggerCompletionFeedback(store.state.soundEnabled);
      emitComplete(completedLabel);
      return true;
    }
    emitTick();
    return false;
  }

  function start(durationSec, label, exerciseId = null) {
    clearInterval(timer.intervalId);
    const sec = Math.max(1, Number(durationSec) || 60);
    timer.exerciseId = exerciseId;
    timer.duration = sec;
    timer.remaining = sec;
    timer.label = label || "휴식";
    timer.endTimestamp = Date.now() + sec * 1000;
    timer.running = true;

    triggerNativeTimer(sec, timer.label);
    emitTick();

    timer.intervalId = setInterval(() => {
      syncWithClock();
    }, 250);
  }

  function toggle(defaultSec = 60, defaultLabel = "휴식", exerciseId = null) {
    if (timer.running) {
      syncWithClock();
      clearInterval(timer.intervalId);
      timer.intervalId = null;
      timer.running = false;
      timer.endTimestamp = 0;
      cancelNativeTimer();
      emitTick();
    } else {
      const rem = timer.remaining > 0 ? timer.remaining : (Number(defaultSec) || 60);
      start(rem, timer.label || defaultLabel, exerciseId || timer.exerciseId);
    }
  }

  function addSeconds(delta = 15) {
    const d = Number(delta) || 15;
    if (timer.running) {
      syncWithClock();
      timer.endTimestamp += d * 1000;
      timer.remaining = Math.max(1, Math.ceil((timer.endTimestamp - Date.now()) / 1000));
      timer.duration = Math.max(timer.duration, timer.remaining);
      triggerNativeTimer(timer.remaining, timer.label);
    } else {
      timer.remaining = Math.max(0, timer.remaining + d);
      timer.duration = Math.max(timer.duration, timer.remaining);
    }
    emitTick();
  }

  function reset(sec = 60, exerciseId = null) {
    clearInterval(timer.intervalId);
    timer.intervalId = null;
    timer.running = false;
    timer.endTimestamp = 0;
    timer.exerciseId = exerciseId;
    const s = Math.max(1, Number(sec) || 60);
    timer.remaining = s;
    timer.duration = s;
    timer.label = "휴식";
    cancelNativeTimer();
    emitTick();
  }

  /**
   * When viewing a different exercise while timer is IDLE, update preview duration
   * to match the current exercise's default rest time.
   */
  function previewExerciseRest(ex) {
    if (!ex || timer.running) return;
    if (timer.exerciseId !== ex.id) {
      const sec = Number(ex.restSec) || 60;
      timer.exerciseId = ex.id;
      timer.duration = sec;
      timer.remaining = sec;
      timer.label = "휴식";
    }
  }

  return {
    timer,
    start,
    toggle,
    addSeconds,
    reset,
    syncWithClock,
    previewExerciseRest
  };
}

/**
 * Separate Work-Set Countdown Timer with 3 -> 2 -> 1 Preparation Countdown
 * for time-based exercises (reps containing "초").
 */
export function createWorkTimerController(store, callbacks = {}) {
  const workTimer = {
    exerciseId: null,
    phase: "idle", // "idle" | "prep" | "running" | "paused" | "done"
    prepRemaining: 0,
    duration: 45,
    remaining: 45,
    endTimestamp: 0,
    lastPrepAnnounced: 0,
    intervalId: null,
    label: ""
  };

  function emitTick() {
    if (typeof callbacks.onTick === "function") callbacks.onTick(workTimer);
  }

  function emitComplete(completedLabel) {
    if (typeof callbacks.onComplete === "function") callbacks.onComplete(completedLabel, workTimer);
  }

  function clearTicker() {
    if (workTimer.intervalId) {
      clearInterval(workTimer.intervalId);
      workTimer.intervalId = null;
    }
  }

  function syncWithClock() {
    if (workTimer.phase !== "prep" && workTimer.phase !== "running") return false;
    if (!workTimer.endTimestamp) return false;
    const rem = Math.max(0, Math.ceil((workTimer.endTimestamp - Date.now()) / 1000));

    if (workTimer.phase === "prep") {
      if (rem <= 0) {
        // Prep finished -> begin main work countdown
        playCountdownBeep(store.state.soundEnabled, true);
        triggerNativeHaptic();
        workTimer.phase = "running";
        workTimer.prepRemaining = 0;
        workTimer.lastPrepAnnounced = 0;
        workTimer.remaining = workTimer.duration;
        workTimer.endTimestamp = Date.now() + workTimer.duration * 1000;
        emitTick();
        return false;
      }
      workTimer.prepRemaining = rem;
      if (rem !== workTimer.lastPrepAnnounced) {
        workTimer.lastPrepAnnounced = rem;
        playCountdownBeep(store.state.soundEnabled, false);
        triggerNativeHaptic();
      }
      emitTick();
      return false;
    }

    // phase === "running"
    workTimer.remaining = rem;
    if (rem <= 0) {
      clearTicker();
      workTimer.phase = "done";
      workTimer.endTimestamp = 0;
      workTimer.remaining = 0;
      const doneLabel = workTimer.label;
      emitTick();
      triggerCompletionFeedback(store.state.soundEnabled);
      emitComplete(doneLabel);
      return true;
    }
    emitTick();
    return false;
  }

  function startWithPrep(durationSec, label, exerciseId = null) {
    clearTicker();
    const sec = Math.max(5, Number(durationSec) || 30);
    workTimer.exerciseId = exerciseId;
    workTimer.label = label || "수행";
    workTimer.duration = sec;
    workTimer.remaining = sec;
    workTimer.phase = "prep";
    workTimer.prepRemaining = 3;
    workTimer.lastPrepAnnounced = 3;
    workTimer.endTimestamp = Date.now() + 3000;

    playCountdownBeep(store.state.soundEnabled, false);
    triggerNativeHaptic();
    emitTick();

    workTimer.intervalId = setInterval(() => {
      syncWithClock();
    }, 150);
  }

  function togglePause() {
    if (workTimer.phase === "running") {
      syncWithClock();
      clearTicker();
      workTimer.phase = "paused";
      workTimer.endTimestamp = 0;
      emitTick();
    } else if (workTimer.phase === "paused") {
      clearTicker();
      const rem = Math.max(1, workTimer.remaining);
      workTimer.phase = "running";
      workTimer.endTimestamp = Date.now() + rem * 1000;
      emitTick();
      workTimer.intervalId = setInterval(() => {
        syncWithClock();
      }, 150);
    } else if (workTimer.phase === "prep") {
      clearTicker();
      workTimer.phase = "idle";
      workTimer.prepRemaining = 0;
      workTimer.endTimestamp = 0;
      workTimer.remaining = workTimer.duration;
      emitTick();
    }
  }

  function reset(sec = null, exerciseId = null) {
    clearTicker();
    const s = Math.max(5, Number(sec || workTimer.duration) || 30);
    if (exerciseId !== null) workTimer.exerciseId = exerciseId;
    workTimer.phase = "idle";
    workTimer.prepRemaining = 0;
    workTimer.lastPrepAnnounced = 0;
    workTimer.duration = s;
    workTimer.remaining = s;
    workTimer.endTimestamp = 0;
    emitTick();
  }

  function syncCardTarget(exId, targetSec) {
    if (!targetSec) return;
    if (workTimer.phase === "prep" || workTimer.phase === "running" || workTimer.phase === "paused") {
      return;
    }
    if (workTimer.exerciseId !== exId || workTimer.duration !== targetSec) {
      workTimer.exerciseId = exId;
      workTimer.phase = "idle";
      workTimer.duration = targetSec;
      workTimer.remaining = targetSec;
    }
  }

  return {
    workTimer,
    startWithPrep,
    togglePause,
    reset,
    syncWithClock,
    syncCardTarget
  };
}
