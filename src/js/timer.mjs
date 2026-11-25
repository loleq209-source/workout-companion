/**
 * Wall-clock accurate rest timer (drift-free across background / screen lock).
 */
import { triggerNativeTimer, cancelNativeTimer, triggerCompletionFeedback } from "./bridge.mjs";

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
