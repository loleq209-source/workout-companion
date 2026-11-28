/**
 * Smart Exercise Swap & 1:1 Home <-> Gym Machine Conversion Engine.
 */
import { ENRICHED_DB, getAllExercises, getMuscleGroup, isWarmupOrStretch, findPainAlertAlternative } from "./data.mjs";

export const HOME_TO_GYM_MAP = {
  // 상체 밀기 (가슴)
  home_deep_pushup: ["gym_chest_press", "gym_bench_press"],
  home_decline_pushup: ["gym_bench_press", "gym_chest_press"],
  home_kb_floor_2arm: ["gym_chest_press", "gym_bench_press"],
  home_kb_floor_1arm: ["gym_chest_press", "gym_bench_press"],
  home_close_pushup: ["gym_pec_deck", "gym_chest_press"],
  home_dips: ["gym_chest_press", "gym_pec_deck"],
  home_kb_triceps: ["gym_pec_deck", "gym_chest_press"],

  // 상체 밀기 (어깨)
  home_kb_press: ["gym_shoulder_press"],
  home_pike_pushup: ["gym_shoulder_press"],
  home_kb_halo: ["gym_shoulder_press"],

  // 상체 당기기 (수직)
  home_band_pullup: ["gym_high_pulley", "gym_long_pull"],
  home_band_chinup: ["gym_high_pulley", "gym_long_pull"],
  home_scapular_pullup: ["gym_high_pulley", "gym_long_pull"],
  home_pullup: ["gym_high_pulley"],

  // 상체 당기기 (수평)
  home_kb_row: ["gym_long_pull", "gym_high_pulley"],

  // 팔 (이두·악력)
  home_kb_curl: ["gym_arm_curl"],
  home_gyro_ball: ["gym_arm_curl"],

  // 하체 (전면·복합)
  home_goblet_squat: ["gym_leg_press", "gym_leg_ext"],
  home_bulgarian: ["gym_leg_press", "gym_leg_ext"],

  // 하체 (후면·둔근)
  home_kickstand_rdl: ["gym_leg_curl", "gym_inner_thigh"],
  home_kb_glute_bridge: ["gym_leg_curl", "gym_inner_thigh"],
  home_kb_swing: ["gym_leg_curl", "gym_leg_press"],

  // 코어
  home_forearm_plank: ["gym_plank"],
  home_deadbug: ["gym_plank"],
  home_hanging_knee: ["gym_plank"],
  home_side_bend: ["gym_plank"],
  home_core_twist: ["gym_plank"],
  home_kb_suitcase_carry: ["gym_plank"]
};

export const GYM_TO_HOME_MAP = {
  gym_chest_press: ["home_deep_pushup", "home_kb_floor_2arm", "home_dips"],
  gym_bench_press: ["home_decline_pushup", "home_deep_pushup", "home_kb_floor_2arm"],
  gym_pec_deck: ["home_close_pushup", "home_kb_floor_2arm"],
  gym_shoulder_press: ["home_kb_press", "home_pike_pushup", "home_kb_halo"],
  gym_high_pulley: ["home_band_pullup", "home_band_chinup", "home_scapular_pullup"],
  gym_long_pull: ["home_kb_row", "home_band_pullup"],
  gym_arm_curl: ["home_kb_curl"],
  gym_leg_press: ["home_goblet_squat", "home_bulgarian"],
  gym_leg_ext: ["home_bulgarian", "home_goblet_squat"],
  gym_leg_curl: ["home_kickstand_rdl", "home_kb_glute_bridge", "home_kb_swing"],
  gym_inner_thigh: ["home_kb_glute_bridge", "home_goblet_squat"],
  gym_plank: ["home_forearm_plank", "home_deadbug", "home_hanging_knee"]
};

export function pickModeConversionTarget(ex, targetMode, usedIds, customExercises = []) {
  if (!ex || !ex.id) return null;
  if (isWarmupOrStretch(ex)) return null; // Warmup & foam roller stretches stay untouched
  if (ex.mode === targetMode) return null;

  const allEx = getAllExercises(customExercises);
  const directList = targetMode === "gym" ? HOME_TO_GYM_MAP[ex.id] : GYM_TO_HOME_MAP[ex.id];
  if (Array.isArray(directList) && directList.length > 0) {
    const unused = directList.find(id => !usedIds.has(id) && allEx.some(x => x.id === id));
    if (unused) return allEx.find(x => x.id === unused) || null;
    const firstValid = directList.find(id => allEx.some(x => x.id === id));
    if (firstValid) return allEx.find(x => x.id === firstValid) || null;
  }

  // Fallback by muscle group
  const grp = getMuscleGroup(ex);
  const sameGrp = allEx.filter(
    x => x.mode === targetMode && !isWarmupOrStretch(x) && getMuscleGroup(x) === grp && !usedIds.has(x.id)
  );
  if (sameGrp.length > 0) return sameGrp[0];

  const anySameGrp = allEx.filter(x => x.mode === targetMode && !isWarmupOrStretch(x) && getMuscleGroup(x) === grp);
  return anySameGrp[0] || null;
}

/**
 * Returns ranked swap candidates (max 5) for a given exercise & targetMode ("home" | "gym"):
 * 1) Pain-safe recommendations (matching active painAreas first, then other painAlternatives)
 * 2) Target-matched equivalents (1:1 mode counterparts + same muscle group alternatives)
 */
export function getSwapCandidates(ex, targetMode, painAreas = [], customExercises = [], dislikedIds = []) {
  if (!ex) return [];
  const allEx = getAllExercises(customExercises);
  const byId = new Map(allEx.map(x => [x.id, x]));
  const dislikedSet = new Set(Array.isArray(dislikedIds) ? dislikedIds : []);
  const seen = new Set([ex.id]);
  const results = [];

  const pushCandidate = (candEx, badgeType, tagText, reasonText = "") => {
    if (!candEx || seen.has(candEx.id)) return;
    if (candEx.mode !== targetMode) return;
    seen.add(candEx.id);
    results.push({
      ex: candEx,
      badgeType, // "pain_active" | "pain_alt" | "target"
      tagText,
      reasonText,
      isDisliked: dislikedSet.has(candEx.id)
    });
  };

  // 1a. Active pain-area match first
  const activeAlert = findPainAlertAlternative(ex, painAreas);
  if (activeAlert && byId.has(activeAlert.altId)) {
    const c = byId.get(activeAlert.altId);
    if (c.mode === targetMode) {
      pushCandidate(c, "pain_active", `🩹 ${activeAlert.matchedArea} 안전 추천`, activeAlert.reason || "");
    }
  }

  // 1b. Other painAlternatives defined in ENRICHED_DB for targetMode
  const enriched = ENRICHED_DB[ex.id];
  const painAlts = enriched && Array.isArray(enriched.painAlternatives) ? enriched.painAlternatives : [];
  for (const alt of painAlts) {
    if (!alt || !alt.altId || !byId.has(alt.altId)) continue;
    const c = byId.get(alt.altId);
    if (c.mode !== targetMode) continue;
    const isActivePain = Array.isArray(painAreas) && painAreas.some(p => alt.area.includes(p) || p.includes(alt.area));
    pushCandidate(
      c,
      isActivePain ? "pain_active" : "pain_alt",
      isActivePain ? `🩹 ${alt.area} 안전 추천` : `🩹 ${alt.area} 불편 시`,
      alt.reason || ""
    );
  }

  // 2a. Direct 1:1 Home<->Gym mapped equivalents (when converting to opposite mode)
  const directList = targetMode === "gym" ? HOME_TO_GYM_MAP[ex.id] : GYM_TO_HOME_MAP[ex.id];
  if (Array.isArray(directList)) {
    for (const tid of directList) {
      if (byId.has(tid)) {
        pushCandidate(byId.get(tid), "target", "🎯 1:1 기구/홈트 대응");
      }
    }
  }

  // 2b. Exercises in targetMode sharing muscle group & overlapping targetMuscle keywords
  const grp = getMuscleGroup(ex);
  const srcStretch = isWarmupOrStretch(ex);
  const srcTokens = String(ex.targetMuscle || "")
    .split(/[·,\s()]+/)
    .filter(t => t.length >= 2);

  const pool = allEx
    .filter(x => x.mode === targetMode && !seen.has(x.id))
    .map(x => {
      let score = 0;
      if (srcStretch && isWarmupOrStretch(x)) score += 10;
      else if (!srcStretch && !isWarmupOrStretch(x) && getMuscleGroup(x) === grp) score += 10;
      else if (!srcStretch && getMuscleGroup(x) !== grp) score -= 5;
      for (const tok of srcTokens) {
        if ((x.targetMuscle || "").includes(tok)) score += 3;
      }
      if (x.category === ex.category) score += 2;
      return { ex: x, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  for (const item of pool) {
    pushCandidate(item.ex, "target", "🎯 동일 타깃 부위");
  }

  // If pain_active existed only in opposite mode, allow showing it cleanly if targetMode has few candidates
  if (activeAlert && !results.some(r => r.badgeType === "pain_active") && byId.has(activeAlert.altId)) {
    const opp = byId.get(activeAlert.altId);
    if (!seen.has(opp.id)) {
      seen.add(opp.id);
      results.unshift({
        ex: opp,
        badgeType: "pain_active",
        tagText: `🩹 ${activeAlert.matchedArea} 안전 추천 (${opp.mode === "gym" ? "기구" : "홈트"})`,
        reasonText: activeAlert.reason || "",
        isDisliked: dislikedSet.has(opp.id)
      });
    }
  }

  // Push disliked exercises to the bottom without blocking explicit selection
  results.sort((a, b) => Number(a.isDisliked) - Number(b.isDisliked));
  return results.slice(0, 5);
}
