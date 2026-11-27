/**
 * Canonical exercise catalog, presets, enriched coaching DB, and media resolver.
 */
import { EXERCISES } from "./exercisesData.mjs";

export { EXERCISES };

/** Populated by build pipeline (or pre-injected ENRICHED_DB global). */
export const ENRICHED_DB =
  typeof __INJECTED_ENRICHED_DB__ !== "undefined" ? __INJECTED_ENRICHED_DB__ : {};

export const PRESETS = [
  { id: "all_catalog", name: "전체 보기" },
  { id: "today_ai", name: "⭐ 오늘 추천" },
  { id: "warmup", name: "🧘 웜업·이완" },
  { id: "upper_core", name: "💪 상체·코어" },
  { id: "lower_core", name: "🦵 하체·코어" },
  { id: "riding_recovery", name: "🚴 라이딩 회복" },
  { id: "custom", name: "✨ 내 종목" }
];

export function resolveAssetBase() {
  if (typeof location !== "undefined" && location.hostname) {
    const host = location.hostname.toLowerCase();
    if (host.includes("google.com") || host.includes("googleusercontent.com")) {
      return "https://loleq209-source.github.io/workout-companion/";
    }
  }
  return "./";
}

export function getGuideMedia(exId) {
  const base = resolveAssetBase();
  // Custom exercises have no built-in WebP illustrations
  if (!exId || String(exId).startsWith("custom_")) return null;
  if (!EXERCISES.some(x => x.id === exId)) return null;
  return {
    full: `${base}assets/guides/${exId}_full.webp`,
    frames: [
      `${base}assets/guides/${exId}_1.webp`,
      `${base}assets/guides/${exId}_2.webp`,
      `${base}assets/guides/${exId}_3.webp`
    ]
  };
}

const STRETCH_IDS = new Set([
  "home_smr",
  "home_thoracic_rot",
  "home_hip_calf",
  "home_smr_neck",
  "home_smr_back",
  "home_dead_hang"
]);

export function isWarmupOrStretch(ex) {
  if (!ex) return false;
  const cat = ex.category || "";
  const id = ex.id || "";
  if (cat.includes("웜업") || cat.includes("이완") || cat.includes("스트레칭")) return true;
  if (STRETCH_IDS.has(id)) return true;
  return false;
}

/**
 * Maps an exercise into one of the 4 tracked muscle groups ("push" | "pull" | "legs" | "core")
 * or returns null for warmup/stretching/cardio exercises.
 */
export function getMuscleGroup(ex) {
  if (!ex) return null;
  if (isWarmupOrStretch(ex)) return null;

  const cat = ex.category || "";
  const id = ex.id || "";

  if (cat.includes("유산소")) return null;

  // Legs first (because gym_leg_press / gym_leg_curl contain "press"/"curl")
  if (
    cat.includes("하체") ||
    id.startsWith("gym_leg_") ||
    id === "gym_inner_thigh" ||
    id.includes("squat") ||
    id.includes("bulgarian") ||
    id.includes("rdl") ||
    id.includes("swing") ||
    id.includes("glute_bridge")
  ) {
    return "legs";
  }

  // Push: 상체 밀기, 상체 밀기·어깨, pushups, dips, chest/shoulder presses
  if (
    cat.includes("밀기") ||
    id.includes("pushup") ||
    id.includes("dips") ||
    id === "gym_chest_press" ||
    id === "gym_bench_press" ||
    id === "gym_pec_deck" ||
    id === "gym_shoulder_press" ||
    id === "home_kb_press" ||
    id === "home_kb_halo" ||
    id === "home_kb_triceps" ||
    id.includes("floor_1arm") ||
    id.includes("floor_2arm")
  ) {
    return "push";
  }

  // Pull: 상체 당기기, pullups, rows, curls, gyro ball
  if (
    cat.includes("당기기") ||
    id.includes("pull") ||
    id.includes("row") ||
    id.includes("curl") ||
    id === "home_gyro_ball"
  ) {
    return "pull";
  }

  // Core
  if (
    cat.includes("코어") ||
    id.includes("plank") ||
    id.includes("deadbug") ||
    id.includes("knee") ||
    id.includes("twist") ||
    id.includes("side_bend") ||
    id.includes("suitcase_carry")
  ) {
    return "core";
  }

  return null;
}

export function getAllExercises(customExercises = []) {
  return [...EXERCISES, ...(Array.isArray(customExercises) ? customExercises : [])];
}
