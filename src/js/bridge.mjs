/**
 * Native AndroidBridge (v2.1 + v3.0 compatible), Web Audio completion chime, and Haptics.
 */

export function hasAndroidBridge() {
  return typeof window !== "undefined" && typeof window.AndroidBridge === "object" && window.AndroidBridge !== null;
}

export function hasGasBridge() {
  return (
    typeof window !== "undefined" &&
    typeof window.google === "object" &&
    window.google &&
    window.google.script &&
    typeof window.google.script.run === "object"
  );
}

export function triggerNativeTimer(seconds, label) {
  if (!hasAndroidBridge()) return;
  const b = window.AndroidBridge;
  const safeLabel = label || "휴식";
  try {
    if (typeof b.startRestTimer === "function") {
      b.startRestTimer(seconds, safeLabel);
    } else if (typeof b.startRestTimerNotification === "function") {
      b.startRestTimerNotification(seconds, safeLabel);
    }
  } catch (e) {}
}

export function cancelNativeTimer() {
  if (!hasAndroidBridge()) return;
  const b = window.AndroidBridge;
  try {
    if (typeof b.cancelRestTimer === "function") {
      b.cancelRestTimer();
    } else if (typeof b.cancelRestTimerNotification === "function") {
      b.cancelRestTimerNotification();
    }
  } catch (e) {}
}

export function triggerNativeHaptic() {
  if (hasAndroidBridge()) {
    const b = window.AndroidBridge;
    try {
      if (typeof b.vibrateClick === "function") {
        b.vibrateClick();
        return;
      }
      if (typeof b.vibrateShort === "function") {
        b.vibrateShort();
        return;
      }
    } catch (e) {}
  }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(25);
    } catch (e) {}
  }
}

export function playCompletionChime(soundEnabled = true) {
  if (!soundEnabled || typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const playTone = (freq, startOffset, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startOffset);
      osc.stop(ctx.currentTime + startOffset + dur + 0.02);
    };
    playTone(880, 0, 0.22);
    playTone(1174.66, 0.18, 0.34);
    setTimeout(() => {
      try { ctx.close(); } catch (e) {}
    }, 800);
  } catch (e) {}
}

export function triggerCompletionFeedback(soundEnabled = true) {
  playCompletionChime(soundEnabled);
  if (hasAndroidBridge()) {
    const b = window.AndroidBridge;
    try {
      if (typeof b.vibrateCompletion === "function") {
        b.vibrateCompletion();
        return;
      }
      if (typeof b.vibrateShort === "function") {
        b.vibrateShort();
        return;
      }
    } catch (e) {}
  }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([120, 60, 120, 60, 200]);
    } catch (e) {}
  }
}
