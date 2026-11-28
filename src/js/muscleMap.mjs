/**
 * Maps all 48+ exercises to Front (6) & Back (7) anatomical muscle regions,
 * aggregates today's completion data, and computes heatmap intensity & recovery guidance.
 */
import { isWarmupOrStretch, getMuscleGroup } from "./data.mjs";
import { computeExerciseLoad, computeSessionStss, calculateWorkoutMetrics } from "./metrics.mjs";

export const MUSCLE_REGIONS = {
  // Front (6)
  chest: { id: "chest", side: "front", label: "가슴 (대흉근)", short: "가슴", group: "push" },
  front_delts: { id: "front_delts", side: "front", label: "어깨 (전·측면)", short: "어깨", group: "push" },
  biceps: { id: "biceps", side: "front", label: "이두근", short: "이두", group: "pull" },
  forearms: { id: "forearms", side: "front", label: "전완·악력", short: "전완", group: "pull" },
  core: { id: "core", side: "front", label: "코어 (복직·복사근)", short: "코어", group: "core" },
  quads_hip: { id: "quads_hip", side: "front", label: "대퇴사두·장요근", short: "대퇴·장요근", group: "legs" },
  // Back (7)
  traps_rear_delts: { id: "traps_rear_delts", side: "back", label: "승모·후면어깨·능형근", short: "승모·후면", group: "pull" },
  lats: { id: "lats", side: "back", label: "등·광배근", short: "등·광배", group: "pull" },
  triceps: { id: "triceps", side: "back", label: "삼두근", short: "삼두", group: "push" },
  lower_back: { id: "lower_back", side: "back", label: "척추기립근·허리", short: "기립근", group: "core" },
  glutes: { id: "glutes", side: "back", label: "둔근·이상근", short: "둔근", group: "legs" },
  hamstrings: { id: "hamstrings", side: "back", label: "햄스트링", short: "햄스트링", group: "legs" },
  calves: { id: "calves", side: "back", label: "종아리", short: "종아리", group: "legs" }
};

const EXACT_MAP = {
  // Warmup / Stretch
  home_smr: { stretch: ["traps_rear_delts", "lats"] },
  home_thoracic_rot: { stretch: ["traps_rear_delts", "lower_back"] },
  home_hip_flexor_stretch: { stretch: ["quads_hip"] },
  home_calf_stretch: { stretch: ["calves"] },
  home_hip_calf: { stretch: ["quads_hip", "calves"] },
  home_smr_glute: { stretch: ["glutes"] },
  home_smr_thoracic: { stretch: ["traps_rear_delts", "lats"] },
  home_smr_quad_itb: { stretch: ["quads_hip"] },
  home_smr_back: { stretch: ["glutes", "traps_rear_delts"] },
  home_smr_suboccipital: { stretch: ["traps_rear_delts"] },
  home_smr_chest_open: { stretch: ["chest", "front_delts"] },
  home_smr_neck: { stretch: ["traps_rear_delts", "chest"] },
  home_dead_hang: { stretch: ["lats", "forearms"] },

  // Pull
  home_band_pullup: { primary: ["lats", "traps_rear_delts"], secondary: ["biceps", "forearms"] },
  home_band_chinup: { primary: ["lats", "biceps"], secondary: ["traps_rear_delts", "forearms"] },
  home_pullup: { primary: ["lats", "traps_rear_delts"], secondary: ["biceps", "forearms"] },
  home_scapular_pullup: { primary: ["lats", "traps_rear_delts"], secondary: ["forearms"] },
  home_inverted_row: { primary: ["lats", "traps_rear_delts"], secondary: ["biceps", "forearms"] },
  home_kb_upright_row: { primary: ["front_delts", "traps_rear_delts"], secondary: ["forearms"] },
  home_kb_row: { primary: ["lats", "traps_rear_delts"], secondary: ["biceps", "forearms", "lower_back"] },
  home_kb_curl: { primary: ["biceps"], secondary: ["forearms"] },
  home_gyro_ball: { primary: ["forearms"], secondary: [] },
  gym_high_pulley: { primary: ["lats"], secondary: ["traps_rear_delts", "biceps"] },
  gym_long_pull: { primary: ["lats", "traps_rear_delts"], secondary: ["biceps", "forearms"] },
  gym_arm_curl: { primary: ["biceps"], secondary: ["forearms"] },

  // Push
  home_deep_pushup: { primary: ["chest"], secondary: ["front_delts", "triceps"] },
  home_decline_pushup: { primary: ["chest", "front_delts"], secondary: ["triceps"] },
  home_pike_pushup: { primary: ["front_delts"], secondary: ["triceps", "chest"] },
  home_pushup_scapula: { primary: ["chest", "front_delts"], secondary: ["core"] },
  home_close_pushup: { primary: ["triceps", "chest"], secondary: ["front_delts"] },
  home_dips: { primary: ["chest", "triceps"], secondary: ["front_delts"] },
  home_kb_floor_1arm: { primary: ["chest"], secondary: ["front_delts", "triceps", "core"] },
  home_kb_floor_2arm: { primary: ["chest"], secondary: ["front_delts", "triceps"] },
  home_kb_press: { primary: ["front_delts"], secondary: ["triceps", "traps_rear_delts"] },
  home_kb_clean_press: { primary: ["front_delts", "triceps"], secondary: ["core", "glutes"] },
  home_kb_halo: { primary: ["front_delts", "traps_rear_delts"], secondary: ["core"] },
  home_kb_triceps: { primary: ["triceps"], secondary: ["front_delts"] },
  gym_chest_press: { primary: ["chest"], secondary: ["front_delts", "triceps"] },
  gym_bench_press: { primary: ["chest"], secondary: ["front_delts", "triceps"] },
  gym_pec_deck: { primary: ["chest"], secondary: ["front_delts"] },
  gym_shoulder_press: { primary: ["front_delts"], secondary: ["triceps", "traps_rear_delts"] },

  // Legs
  home_goblet_squat: { primary: ["quads_hip", "glutes"], secondary: ["hamstrings", "core"] },
  home_bulgarian: { primary: ["quads_hip", "glutes"], secondary: ["hamstrings", "calves"] },
  home_kb_reverse_lunge: { primary: ["quads_hip", "glutes"], secondary: ["hamstrings", "core"] },
  home_kb_sumo_deadlift: { primary: ["quads_hip", "glutes"], secondary: ["hamstrings", "lower_back"] },
  home_kb_calf_raise: { primary: ["calves"], secondary: [] },
  home_kickstand_rdl: { primary: ["hamstrings", "glutes"], secondary: ["lower_back", "forearms"] },
  home_kb_swing: { primary: ["glutes", "hamstrings"], secondary: ["lower_back", "core", "forearms"] },
  home_kb_glute_bridge: { primary: ["glutes"], secondary: ["hamstrings", "lower_back"] },
  gym_leg_press: { primary: ["quads_hip", "glutes"], secondary: ["hamstrings", "calves"] },
  gym_leg_ext: { primary: ["quads_hip"], secondary: [] },
  gym_leg_curl: { primary: ["hamstrings"], secondary: ["calves"] },
  gym_inner_thigh: { primary: ["quads_hip"], secondary: [] },

  // Core
  home_forearm_plank: { primary: ["core"], secondary: ["front_delts", "lower_back"] },
  home_side_plank: { primary: ["core", "glutes"], secondary: ["lower_back"] },
  home_bird_dog: { primary: ["lower_back", "core"], secondary: ["glutes"] },
  home_deadbug: { primary: ["core"], secondary: [] },
  home_plank_deadbug: { primary: ["core"], secondary: ["lower_back"] },
  home_hanging_knee: { primary: ["core", "quads_hip"], secondary: ["forearms"] },
  home_core_twist: { primary: ["core"], secondary: [] },
  home_side_bend: { primary: ["core"], secondary: ["lower_back"] },
  home_kb_suitcase_carry: { primary: ["core", "forearms"], secondary: ["traps_rear_delts", "lower_back"] },
  gym_plank: { primary: ["core"], secondary: ["front_delts", "lower_back"] }
};

export function mapExerciseToMuscleRegions(ex) {
  if (!ex) return { primary: [], secondary: [], stretch: [] };
  const id = ex.id || "";
  if (EXACT_MAP[id]) {
    return {
      primary: EXACT_MAP[id].primary || [],
      secondary: EXACT_MAP[id].secondary || [],
      stretch: EXACT_MAP[id].stretch || []
    };
  }

  const text = `${ex.targetMuscle || ""} ${ex.category || ""} ${ex.name || ""}`;
  const matched = [];
  if (/가슴|흉근|벤치|푸시업|딥스|펙덱/.test(text)) matched.push("chest");
  if (/삼각근|어깨|프레스|숄더/.test(text)) matched.push("front_delts");
  if (/이두|바이셉|컬/.test(text)) matched.push("biceps");
  if (/전완|악력|자이로/.test(text)) matched.push("forearms");
  if (/복직|복횡|복사|코어|플랭크|데드버그/.test(text)) matched.push("core");
  if (/대퇴|사두|장요근|스쿼트|런지|레그프레스|내전/.test(text)) matched.push("quads_hip");
  if (/승모|후면|능형|흉추|후두/.test(text)) matched.push("traps_rear_delts");
  if (/광배|대원근|풀업|친업|로우|랫/.test(text)) matched.push("lats");
  if (/삼두|트라이셉/.test(text)) matched.push("triceps");
  if (/기립근|요방|허리|요추/.test(text)) matched.push("lower_back");
  if (/둔근|이상근|엉덩이|힙/.test(text)) matched.push("glutes");
  if (/햄스트링|데드|스윙|레그컬/.test(text)) matched.push("hamstrings");
  if (/종아리|비복근|가자미/.test(text)) matched.push("calves");

  const unique = [...new Set(matched)];
  if (isWarmupOrStretch(ex)) {
    return { primary: [], secondary: [], stretch: unique.length ? unique : ["traps_rear_delts", "glutes"] };
  }
  if (unique.length === 0) {
    const grp = getMuscleGroup(ex);
    if (grp === "push") return { primary: ["chest", "front_delts"], secondary: ["triceps"], stretch: [] };
    if (grp === "pull") return { primary: ["lats", "traps_rear_delts"], secondary: ["biceps"], stretch: [] };
    if (grp === "legs") return { primary: ["quads_hip", "glutes"], secondary: ["hamstrings"], stretch: [] };
    if (grp === "core") return { primary: ["core"], secondary: [], stretch: [] };
  }
  return { primary: unique.slice(0, 2), secondary: unique.slice(2), stretch: [] };
}

/**
 * Builds complete today report data from current routine & records.
 */
export function buildTodayReportData(store) {
  const items = store.getTodayRoutineExercises();
  const regionStats = {};
  for (const key of Object.keys(MUSCLE_REGIONS)) {
    regionStats[key] = {
      id: key,
      ...MUSCLE_REGIONS[key],
      primarySets: 0,
      secondarySets: 0,
      totalSets: 0,
      load: 0,
      rpeWeightedSum: 0,
      rpeWeight: 0,
      stretched: false
    };
  }

  let completedExercises = 0;
  let totalSetsDone = 0;
  let totalVolumeKg = 0;
  let rpeSum = 0;
  let rpeCount = 0;
  const sessionExercises = [];

  for (const ex of items) {
    const rec = store.getRecord(ex);
    const setsArr = Array.isArray(rec.sets) ? rec.sets : [];
    const doneSets = setsArr.filter(s => s && s.done);
    const doneCount = doneSets.length;
    const isDone = !!rec.isCompleted || (doneCount >= setsArr.length && setsArr.length > 0);
    if (isDone) completedExercises++;
    totalSetsDone += doneCount;

    const isStretch = isWarmupOrStretch(ex);
    const rpe = rec.rpe != null ? Number(rec.rpe) : null;
    if (!isStretch && rpe != null && rpe > 0) {
      rpeSum += rpe;
      rpeCount++;
    }

    for (const s of doneSets) {
      const w = Number(s.weightKg) || 0;
      const repsMatch = String(s.reps || "").match(/(\d+)/);
      const repsNum = repsMatch ? parseInt(repsMatch[1], 10) : 1;
      if (w > 0 && !String(s.reps || "").includes("초")) {
        totalVolumeKg += w * repsNum;
      }
    }

    sessionExercises.push({
      id: ex.id,
      category: ex.category,
      completedSets: doneCount,
      rpe
    });

    if (doneCount === 0 && !isDone) continue;
    const effectiveSets = doneCount > 0 ? doneCount : setsArr.length || 1;
    const mapped = mapExerciseToMuscleRegions(ex);

    if (isStretch) {
      for (const rId of mapped.stretch) {
        if (regionStats[rId]) regionStats[rId].stretched = true;
      }
      continue;
    }

    const effRpe = rpe != null && rpe > 0 ? rpe : 5;
    const exLoad = computeExerciseLoad(effectiveSets, effRpe);

    for (const rId of mapped.primary) {
      const st = regionStats[rId];
      if (!st) continue;
      st.primarySets += effectiveSets;
      st.totalSets += effectiveSets;
      st.load += exLoad;
      if (rpe != null && rpe > 0) {
        st.rpeWeightedSum += rpe * effectiveSets;
        st.rpeWeight += effectiveSets;
      }
    }
    for (const rId of mapped.secondary) {
      const st = regionStats[rId];
      if (!st) continue;
      st.secondarySets += effectiveSets;
      st.totalSets += Math.max(1, Math.round(effectiveSets * 0.5));
      st.load += exLoad * 0.45;
      if (rpe != null && rpe > 0) {
        st.rpeWeightedSum += rpe * (effectiveSets * 0.5);
        st.rpeWeight += effectiveSets * 0.5;
      }
    }
  }

  const todayStss = computeSessionStss({ exercises: sessionExercises });
  const metrics = calculateWorkoutMetrics(store.state.history, store.state.wellness);

  // Assign heatmap levels: primary (#a3e635), secondary (#4d7c0f), stretch (#38bdf8), rest (#26262a)
  const activeStrengthRegions = Object.values(regionStats).filter(r => r.totalSets > 0);
  const maxLoad = activeStrengthRegions.reduce((m, r) => Math.max(m, r.load), 0);

  for (const r of Object.values(regionStats)) {
    if (r.totalSets > 0) {
      const isTopLoad = maxLoad > 0 && r.load >= maxLoad * 0.65 && r.primarySets > 0;
      if (r.primarySets >= 3 || isTopLoad) {
        r.level = "primary";
      } else {
        r.level = "secondary";
      }
      r.avgRpe = r.rpeWeight > 0 ? Math.round((r.rpeWeightedSum / r.rpeWeight) * 10) / 10 : null;
    } else if (r.stretched) {
      r.level = "stretch";
      r.avgRpe = null;
    } else {
      r.level = "rest";
      r.avgRpe = null;
    }
  }

  const strengthBreakdown = activeStrengthRegions
    .sort((a, b) => b.load - a.load || b.totalSets - a.totalSets);

  const stretchedOnly = Object.values(regionStats)
    .filter(r => r.level === "stretch")
    .map(r => r.short);

  // Recovery guide 1-liner
  const RECOVERY_HOURS = { push: 48, pull: 72, legs: 72, core: 36 };
  const GROUP_LABEL = { push: "밀기", pull: "당기기", legs: "하체", core: "코어" };
  let recoveryGuide = "오늘 운동 자극이 균형 잡혀 있습니다. 수분·단백질 보충 후 충분한 수면을 취하세요.";
  if (strengthBreakdown.length > 0) {
    const topGroup = strengthBreakdown[0].group || "core";
    const hours = RECOVERY_HOURS[topGroup] || 48;
    const freshness = (metrics && metrics.muscleFreshness) || { push: 100, pull: 100, legs: 100, core: 100 };
    const freshest = Object.entries(freshness)
      .filter(([k]) => k !== topGroup)
      .sort((a, b) => b[1] - a[1])[0];
    const nextRec = freshest ? `${GROUP_LABEL[freshest[0]]}(회복도 ${freshest[1]}%)` : "가벼운 유산소·이완";
    recoveryGuide = `오늘 주 자극(${GROUP_LABEL[topGroup]}) 권장 회복 ${hours}h · 다음 운동은 ${nextRec} 위주 추천`;
  } else if (stretchedOnly.length > 0) {
    recoveryGuide = "이완·가동성 중심 세션 완료! 근육 피로가 낮아 내일 본 운동을 쾌적하게 시작할 수 있습니다.";
  }

  return {
    totalExercises: items.length,
    completedExercises,
    totalSetsDone,
    todayStss,
    avgRpe: rpeCount > 0 ? Math.round((rpeSum / rpeCount) * 10) / 10 : null,
    totalVolumeKg: Math.round(totalVolumeKg),
    regionStats,
    strengthBreakdown,
    stretchedOnly,
    recoveryGuide
  };
}
