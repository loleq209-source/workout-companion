/**
 * Client-Side Real-Time Extra Exercise Recommendation Engine.
 * Supports 4 purpose modes:
 *   1) custom  ("🎯 맞춤 추천"): Auto-scoring TOP 4 using muscleFreshness >= 80%,
 *      low weeklyHardSets, pain-area filtering, and dislike deprioritization/exclusion.
 *   2) burning ("🔥 칼로리 버닝"): Full-body / large-muscle metabolic movements.
 *   3) tv      ("📺 TV 보며 가볍게"): Silent, low-impact, floor/grip exercises.
 *   4) care    ("🩹 허리·거북목 케어"): Spinal decompression & thoracic/neck mobility.
 */
import { ENRICHED_DB, getAllExercises, getMuscleGroup, isWarmupOrStretch, findPainAlertAlternative } from "./data.mjs";

export const EXTRA_MODES = [
  { id: "custom", label: "🎯 맞춤 추천", name: "맞춤 추천", desc: "회복도·주간 볼륨·통증 분석 TOP 4" },
  { id: "burning", label: "🔥 칼로리 버닝", name: "칼로리 버닝", desc: "전신·대근육 대사성 운동" },
  { id: "tv", label: "📺 TV 보며 가볍게", name: "TV 보며 가볍게", desc: "무소음·저충격 홈 케어" },
  { id: "care", label: "🩹 허리·거북목 케어", name: "허리·거북목 케어", desc: "척추 감압·목·흉추 이완" }
];

const CURATED_POOLS = {
  burning: [
    "home_kb_swing",
    "home_kb_sumo_deadlift",
    "home_kb_reverse_lunge",
    "home_kb_clean_press",
    "home_kb_suitcase_carry",
    "home_goblet_squat",
    "home_bulgarian",
    "home_kb_glute_bridge",
    "home_dips",
    "home_kb_floor_2arm",
    "gym_leg_press",
    "gym_chest_press"
  ],
  tv: [
    "home_gyro_ball",
    "home_kb_calf_raise",
    "home_side_plank",
    "home_bird_dog",
    "home_smr_chest_open",
    "home_smr_glute",
    "home_smr_quad_itb",
    "home_smr_suboccipital",
    "home_deadbug",
    "home_calf_stretch",
    "home_hip_flexor_stretch"
  ],
  care: [
    "home_smr_glute",
    "home_smr_thoracic",
    "home_smr_suboccipital",
    "home_smr_chest_open",
    "home_dead_hang",
    "home_deadbug",
    "home_bird_dog",
    "home_pushup_scapula",
    "home_thoracic_rot",
    "home_smr",
    "home_smr_quad_itb"
  ]
};

const GROUP_LABEL = {
  push: "가슴·밀기",
  pull: "등·당기기",
  legs: "하체·둔근",
  core: "코어"
};

const PRIORITY_HOME_IDS = new Set([
  "home_inverted_row",
  "home_band_pullup",
  "home_deep_pushup",
  "home_goblet_squat",
  "home_kb_sumo_deadlift",
  "home_kb_reverse_lunge",
  "home_kb_clean_press",
  "home_kb_swing",
  "home_side_plank",
  "home_deadbug",
  "home_bird_dog",
  "home_kb_row",
  "home_dips"
]);

export function getVolumePresetsForExercise(ex) {
  if (!ex) return [];
  const defaultWeight = typeof ex.defaultWeightKg === "number" ? ex.defaultWeightKg : 0;
  const defaultReps = ex.defaultReps || "10회";
  const presets = [
    { id: "light_2", label: "가볍게 2세트", sets: 2, reps: defaultReps, weightKg: defaultWeight },
    { id: "std_3", label: "표준 3세트", sets: 3, reps: defaultReps, weightKg: defaultWeight },
    { id: "focus_5", label: "집중 5세트", sets: 5, reps: defaultReps, weightKg: defaultWeight }
  ];
  if (ex.id === "home_kb_swing") {
    presets.push({
      id: "swing_10x10",
      label: "챌린지 10×10",
      sets: 10,
      reps: "10회",
      weightKg: defaultWeight || 14
    });
  }
  return presets;
}

export function isPainUnsafeForAreas(ex, painAreas = []) {
  if (!ex || !Array.isArray(painAreas) || painAreas.length === 0) return false;
  return Boolean(findPainAlertAlternative(ex, painAreas));
}

function buildCustomReason(ex, grp, fresh, weekly, painAreas) {
  if (!grp) {
    if (painAreas.length > 0) {
      return `${painAreas.join("·")} 긴장 완화 · 안전 이완`;
    }
    return "전신 가동성·이완 보강 · 피로 부담 0";
  }
  const label = GROUP_LABEL[grp] || grp;
  if (painAreas.length > 0) {
    return `${label} 회복 ${fresh}% · ${painAreas.join("·")} 무부담`;
  }
  if (weekly < 10) {
    return `${label} 회복 ${fresh}% · 주간 볼륨 보강`;
  }
  return `${label} 회복 ${fresh}% · 컨디션 최적`;
}

function buildCuratedReason(modeId, ex, grp, freshness, painAreas) {
  const fresh = grp && freshness && freshness[grp] != null ? freshness[grp] : 100;
  const label = grp ? GROUP_LABEL[grp] : "전신·이완";
  if (modeId === "burning") {
    return painAreas.length > 0
      ? `전신 대사성 버닝 · ${painAreas.join("·")} 부담 없음`
      : `전신 대사성 버닝 · ${label} 회복 ${fresh}%`;
  }
  if (modeId === "tv") {
    if (isWarmupOrStretch(ex)) {
      return "무소음 매트 이완 · TV 보며 피로 부담 0";
    }
    return `무소음·저충격 집중 · ${label} 가벼운 자극`;
  }
  if (modeId === "care") {
    return painAreas.length > 0
      ? `${painAreas.join("·")} 케어 · 척추 감압·부드러운 가동성`
      : "척추 감압·거북목 정렬 · 무부담 코어·이완";
  }
  return "";
}

/**
 * Computes top extra exercise recommendations for the selected mode.
 * Returns array of { ex, reason, modeId, modeName, muscleGroup, freshnessPct, weeklySets }.
 */
export function recommendExtraExercises({
  mode = "custom",
  routineItems = [],
  records = {},
  metrics = null,
  painAreas = [],
  dislikedExercises = [],
  customExercises = [],
  routineMode = "home",
  limit = 4
} = {}) {
  const allEx = getAllExercises(customExercises);
  const byId = new Map(allEx.map(x => [x.id, x]));
  const modeMeta = EXTRA_MODES.find(m => m.id === mode) || EXTRA_MODES[0];

  const completedIds = new Set();
  const inRoutineIds = new Set();
  for (const item of routineItems || []) {
    if (!item || !item.id) continue;
    inRoutineIds.add(item.id);
    const rec = records && records[item.id];
    if (rec && rec.isCompleted) {
      completedIds.add(item.id);
    }
  }

  const dislikedSet = new Set(Array.isArray(dislikedExercises) ? dislikedExercises : []);
  if (records) {
    for (const [eid, rec] of Object.entries(records)) {
      if (rec && rec.preference === "dislike") dislikedSet.add(eid);
    }
  }

  const freshness = (metrics && metrics.muscleFreshness) || { push: 100, pull: 100, legs: 100, core: 100 };
  const weeklySets = (metrics && metrics.weeklyHardSets) || { push: 0, pull: 0, legs: 0, core: 0 };

  const isEligibleStrict = ex =>
    ex &&
    !completedIds.has(ex.id) &&
    !inRoutineIds.has(ex.id) &&
    !dislikedSet.has(ex.id) &&
    !isPainUnsafeForAreas(ex, painAreas);

  if (mode !== "custom") {
    const curatedIds = CURATED_POOLS[mode] || [];
    const picked = [];
    const seen = new Set();

    for (const id of curatedIds) {
      const ex = byId.get(id);
      if (!ex || seen.has(ex.id)) continue;
      if (!isEligibleStrict(ex)) continue;
      seen.add(ex.id);
      const grp = getMuscleGroup(ex);
      picked.push({
        ex,
        modeId: mode,
        modeName: modeMeta.name,
        muscleGroup: grp,
        freshnessPct: grp ? (freshness[grp] ?? 100) : 100,
        weeklySets: grp ? (weeklySets[grp] ?? 0) : 0,
        reason: buildCuratedReason(mode, ex, grp, freshness, painAreas)
      });
      if (picked.length >= limit) break;
    }

    // Fallback: if strict pool has < limit (e.g. several already completed or in routine), add non-completed/safe items matching theme
    if (picked.length < limit) {
      for (const ex of allEx) {
        if (picked.length >= limit) break;
        if (seen.has(ex.id) || !isEligibleStrict(ex)) continue;
        if (mode === "burning" && isWarmupOrStretch(ex)) continue;
        if (mode === "care" && !isWarmupOrStretch(ex) && getMuscleGroup(ex) !== "core") continue;
        if (mode === "tv" && (ex.mode === "gym" || (typeof ex.defaultWeightKg === "number" && ex.defaultWeightKg > 14))) continue;
        seen.add(ex.id);
        const grp = getMuscleGroup(ex);
        picked.push({
          ex,
          modeId: mode,
          modeName: modeMeta.name,
          muscleGroup: grp,
          freshnessPct: grp ? (freshness[grp] ?? 100) : 100,
          weeklySets: grp ? (weeklySets[grp] ?? 0) : 0,
          reason: buildCuratedReason(mode, ex, grp, freshness, painAreas)
        });
      }
    }

    return picked;
  }

  // Mode 1: 🎯 맞춤 추천 (Auto-scoring TOP 4)
  const anyGroupRecovered80 = ["push", "pull", "legs", "core"].some(g => (freshness[g] ?? 100) >= 80);

  const scored = allEx
    .filter(ex => isEligibleStrict(ex))
    .map((ex, idx) => {
      const grp = getMuscleGroup(ex);
      let score = 0;

      // Mode alignment (prefer matching home vs gym routine mode)
      if (ex.mode === routineMode) score += 25;
      else if (String(ex.id).startsWith("custom_")) score += 10;
      else score -= 35;

      let fresh = 100;
      let weekly = 0;
      if (grp) {
        fresh = freshness[grp] != null ? freshness[grp] : 100;
        weekly = weeklySets[grp] != null ? weeklySets[grp] : 0;

        if (fresh >= 80) score += 60;
        else if (fresh >= 60) score += 15;
        else score -= 35;

        score += fresh * 0.55;
        score += Math.max(0, 14 - weekly) * 5;
        if (PRIORITY_HOME_IDS.has(ex.id)) score += 6;
      } else {
        // Warmup/mobility: surface prominently when muscles are globally fatigued (<80%)
        score += anyGroupRecovered80 ? 12 : 88;
      }

      if (painAreas.length > 0 && ENRICHED_DB[ex.id]) {
        score += 5;
      }

      return {
        ex,
        grp,
        fresh,
        weekly,
        score,
        origIdx: idx,
        reason: buildCustomReason(ex, grp, fresh, weekly, painAreas)
      };
    });

  // Pick top `limit` with soft muscle-group diversity so TOP 4 isn't monochrome
  const remaining = scored.slice();
  const groupCounts = {};
  const selected = [];

  while (selected.length < limit && remaining.length > 0) {
    remaining.sort((a, b) => {
      const penA = (groupCounts[a.grp || "stretch"] || 0) * 32;
      const penB = (groupCounts[b.grp || "stretch"] || 0) * 32;
      return b.score - penB !== a.score - penA
        ? (b.score - penB) - (a.score - penA)
        : a.origIdx - b.origIdx;
    });
    const best = remaining.shift();
    groupCounts[best.grp || "stretch"] = (groupCounts[best.grp || "stretch"] || 0) + 1;
    selected.push({
      ex: best.ex,
      modeId: "custom",
      modeName: modeMeta.name,
      muscleGroup: best.grp,
      freshnessPct: best.fresh,
      weeklySets: best.weekly,
      score: Math.round((best.score) * 10) / 10,
      reason: best.reason
    });
  }

  return selected;
}
