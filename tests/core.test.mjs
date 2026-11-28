import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { formatLocalDate, addDaysLocal, parseLocalDateNoon, getWorkoutDateStr } from "../src/js/date.mjs";
import { EXERCISES, ENRICHED_DB, getMuscleGroup, isWarmupOrStretch, resolveAssetBase, parseTimedSeconds } from "../src/js/data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enrichedJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../data/exercises_enriched_34.json"), "utf8"));
Object.assign(ENRICHED_DB, enrichedJson.exercises || {});
import { calculateWorkoutMetrics, computeSessionStss } from "../src/js/metrics.mjs";
import { createStore } from "../src/js/store.mjs";
import { upsertTodayHistory, applyLoadedDriveData } from "../src/js/sync.mjs";
import { createTimerController } from "../src/js/timer.mjs";
import { mapExerciseToMuscleRegions, buildTodayReportData } from "../src/js/muscleMap.mjs";
import { getSwapCandidates, HOME_TO_GYM_MAP } from "../src/js/swapEngine.mjs";

function makeMemoryStorage(initial = null) {
  const map = new Map();
  if (initial) map.set("workout_companion_state_v9", JSON.stringify(initial));
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v)
  };
}

test("Date helpers perform local arithmetic without UTC shift", () => {
  const d = new Date(2026, 10, 25, 0, 15, 0); // 2026-11-25 00:15 local
  assert.equal(formatLocalDate(d), "2026-11-25");
  assert.equal(addDaysLocal("2026-11-25", -1), "2026-11-24");
  assert.equal(addDaysLocal("2026-11-25", -6), "2026-11-19");
});

test("Data mapping classifies all 58 exercises cleanly & preserves legacy aliases", () => {
  assert.equal(EXERCISES.length, 58);
  assert.equal(EXERCISES.filter(x => x.mode === "home").length, 46);
  assert.equal(EXERCISES.filter(x => x.mode === "gym").length, 12);
  const legPress = EXERCISES.find(x => x.id === "gym_leg_press");
  const legCurl = EXERCISES.find(x => x.id === "gym_leg_curl");
  const bandPullup = EXERCISES.find(x => x.id === "home_band_pullup");
  const bandChinup = EXERCISES.find(x => x.id === "home_band_chinup");
  const pushup = EXERCISES.find(x => x.id === "home_deep_pushup");
  const smrGlute = EXERCISES.find(x => x.id === "home_smr_glute");
  const hipStretch = EXERCISES.find(x => x.id === "home_hip_flexor_stretch");
  const plank = EXERCISES.find(x => x.id === "home_forearm_plank");
  const deadbug = EXERCISES.find(x => x.id === "home_deadbug");

  assert.equal(getMuscleGroup(legPress), "legs");
  assert.equal(getMuscleGroup(legCurl), "legs");
  assert.equal(getMuscleGroup(bandPullup), "pull");
  assert.equal(getMuscleGroup(bandChinup), "pull");
  assert.equal(getMuscleGroup(pushup), "push");
  assert.equal(getMuscleGroup(plank), "core");
  assert.equal(getMuscleGroup(deadbug), "core");
  assert.equal(getMuscleGroup(smrGlute), null);
  assert.equal(isWarmupOrStretch(smrGlute), true);
  assert.equal(isWarmupOrStretch(hipStretch), true);
  assert.equal(getMuscleGroup({ id: "custom_1", category: "상체 밀기" }), "push");
  assert.equal(getMuscleGroup({ id: "custom_2", category: "하체" }), "legs");
  // Legacy history IDs remain classified accurately
  assert.equal(getMuscleGroup({ id: "home_pullup", category: "상체 당기기" }), "pull");
  assert.equal(isWarmupOrStretch({ id: "home_smr_back", category: "웜업·이완" }), true);
});

test("Routine briefing overrides (sets, reps, weightKg, restSec, reason) & legacy alias resolution", () => {
  const store = createStore(makeMemoryStorage({
    sessionDate: "2026-11-27",
    todayRoutine: {
      date: "2026-11-27",
      title: "AI 브리핑 테스트 루틴",
      yesterdayRecap: "11/26 라이딩 45km 회복 필요",
      cyclingGuide: "존2 40분 가벼운 회전",
      bonusTip: "수분·전해질 보충",
      items: [
        { id: "home_band_pullup", sets: 4, reps: "8회", restSec: 75, reason: "11/24 RPE 6 달성 → 8회 증량" },
        { id: "home_kb_row", sets: 3, reps: "12회", weightKg: 16, restSec: 60, reason: "증량 테스트" },
        { id: "home_hip_calf", sets: 2, reps: "35초", restSec: 30 }
      ]
    },
    records: {
      home_kb_row: {
        sets: [{ weightKg: 14, reps: "10회", done: false }],
        isCompleted: false,
        lastUpdatedDate: "2026-11-26"
      }
    },
    history: [
      {
        date: "2026-11-24",
        exercises: [{ id: "home_pullup", name: "치닝디핑 밴드 풀업 & 친업", completedSets: 3, rpe: 6, isCompleted: true }]
      }
    ]
  }));

  const items = store.getTodayRoutineExercises();
  assert.equal(items.length, 3);
  assert.equal(items[0].id, "home_band_pullup");
  assert.equal(items[0].defaultSets, 4);
  assert.equal(items[0].defaultReps, "8회");
  assert.equal(items[0].restSec, 75);
  assert.equal(items[0].reason, "11/24 RPE 6 달성 → 8회 증량");

  // Routine weightKg overrides stale previous-day weight on untouched day
  const rowRec = store.getRecord(items[1], "2026-11-27");
  assert.equal(rowRec.sets.length, 3);
  assert.equal(rowRec.sets[0].weightKg, 16);
  assert.equal(rowRec.sets[0].reps, "12회");

  // Legacy routine ID resolves cleanly without breaking
  assert.equal(items[2].id, "home_hip_flexor_stretch");

  // Legacy history lookup works for split IDs
  const lastPullup = store.getLastRecord("home_band_pullup");
  assert.ok(lastPullup);
  assert.equal(lastPullup.date, "2026-11-24");

  // Tab switch safety: completed routine item with fewer sets than raw catalog defaultSets stays completed
  const deepPushupRaw = EXERCISES.find(x => x.id === "home_deep_pushup");
  store.state.todayRoutine.items.push({ id: "home_deep_pushup", sets: 3, reps: "10회" });
  const pushupEffective = store.getTodayRoutineExercises().find(x => x.id === "home_deep_pushup");
  const pushupRec = store.getRecord(pushupEffective, "2026-11-27");
  pushupRec.sets.forEach(s => { s.done = true; });
  pushupRec.isCompleted = true;
  pushupRec.lastUpdatedDate = "2026-11-27";

  const todayById = new Map(store.getTodayRoutineExercises().map(x => [x.id, x]));
  const catalogViewRec = store.getRecord(todayById.get(deepPushupRaw.id) || deepPushupRaw, "2026-11-27");
  assert.equal(catalogViewRec.sets.length, 3);
  assert.equal(catalogViewRec.isCompleted, true);
});

test("Metrics calculation preserves cycling wellness & includes today sTSS in local EWMA", () => {
  const wellness = { ctl: 23.7, atl: 1.3, tsb: 22.4 };
  const nowMs = parseLocalDateNoon("2026-11-25").getTime();
  const history = [
    {
      date: "2026-11-24",
      timestamp: "2026-11-24T12:00:00+09:00",
      exercises: [
        { id: "home_smr", category: "웜업·이완", completedSets: 2, rpe: null },
        { id: "home_pullup", category: "상체 당기기", completedSets: 3, rpe: 6 },
        { id: "home_deep_pushup", category: "상체 밀기·어깨", completedSets: 4, rpe: 6 }
      ]
    },
    {
      date: "2026-11-25",
      timestamp: "2026-11-25T11:30:00+09:00",
      exercises: [
        { id: "home_bulgarian", category: "하체·파워", completedSets: 3, rpe: 7 }
      ]
    }
  ];

  const m = calculateWorkoutMetrics(history, wellness, { today: "2026-11-25", nowMs });
  assert.equal(m.cycling.ctl, 23.7);
  assert.equal(m.cycling.atl, 1.3);
  assert.equal(m.cycling.tsb, 22.4);
  // 2026-11-25 leg workout: 3 * (0.7)^2 * 3.5 = 5.145 -> 5.1
  assert.equal(m.todayStss, 5.1);
  assert.ok(m.strengthAtl7d > 0);
  assert.equal(m.totalAtl, Math.round((1.3 + m.strengthAtl7d) * 10) / 10);
  assert.equal(m.weeklyHardSets.pull, 3);
  assert.equal(m.weeklyHardSets.push, 4);
  assert.equal(m.weeklyHardSets.legs, 3);
});

test("Midnight rollover & Drive sync never leak yesterday done flags into today", () => {
  const today = formatLocalDate(new Date());
  const yesterday = addDaysLocal(today, -1);

  const store = createStore(
    makeMemoryStorage({
      sessionDate: yesterday,
      todayRoutine: {
        date: yesterday,
        title: "Yesterday Routine",
        mode: "home",
        items: [{ id: "home_band_pullup", sets: 3, reps: "2회" }]
      },
      records: {
        home_band_pullup: {
          sets: [
            { weightKg: 0, reps: "2회", done: true },
            { weightKg: 0, reps: "2회", done: true },
            { weightKg: 0, reps: "2회", done: true }
          ],
          isCompleted: true,
          rpe: 7,
          preference: "like",
          lastUpdatedDate: yesterday
        }
      }
    })
  );

  // Upon creation for `today`, completion flags must reset while weight & preference persist
  assert.equal(store.state.sessionDate, today);
  assert.equal(store.state.records.home_band_pullup.isCompleted, false);
  assert.equal(store.state.records.home_band_pullup.rpe, null);
  assert.equal(store.state.records.home_band_pullup.preference, "like");
  assert.ok(store.state.records.home_band_pullup.sets.every(s => s.done === false));

  // Before today's routine arrives or user taps sets, upsertTodayHistory must NOT fabricate today's history from yesterday's routine
  upsertTodayHistory(store, today);
  assert.equal(store.state.history.find(h => h.date === today), undefined);

  // Simulate Drive pull returning today's new routine alongside stale yesterday `done: true` in Drive `records`
  applyLoadedDriveData(
    store,
    {
      ok: true,
      todayRoutine: {
        date: today,
        title: "Today New Routine",
        note: "Test note",
        mode: "home",
        items: [{ id: "home_band_pullup", sets: 2, reps: "5회" }]
      },
      history: [{ date: yesterday, exercises: [{ id: "home_band_pullup", completedSets: 3, isCompleted: true, rpe: 7 }] }],
      records: {
        home_band_pullup: {
          sets: [
            { weightKg: 5, reps: "2회", done: true },
            { weightKg: 5, reps: "2회", done: true },
            { weightKg: 5, reps: "2회", done: true }
          ],
          isCompleted: true,
          rpe: 7,
          preference: "like",
          lastUpdatedDate: yesterday
        }
      }
    },
    { silent: true, today }
  );

  // Drive's yesterday `done: true` must NOT pollute today, while weight=5 & new plannedSets=2 & reps=5회 apply!
  const ex = store.getTodayRoutineExercises()[0];
  const reconciled = store.getRecord(ex, today);
  assert.equal(reconciled.isCompleted, false);
  assert.equal(reconciled.sets.length, 2);
  assert.equal(reconciled.sets[0].done, false);
  assert.equal(reconciled.sets[0].weightKg, 5);
  assert.equal(reconciled.sets[0].reps, "5회");
});

test("Catalog filters accurately by preset, mode, preference, and query", () => {
  const store = createStore(makeMemoryStorage());
  store.state.mode = "all";
  store.state.preset = "warmup";
  const warmups = store.getFilteredCatalogExercises();
  assert.ok(warmups.length > 0);
  assert.ok(warmups.every(x => isWarmupOrStretch(x) || (x.presets && x.presets.includes("warmup"))));

  store.state.preset = "all_catalog";
  store.state.searchQuery = "자이로볼";
  const searched = store.getFilteredCatalogExercises();
  assert.equal(searched.length, 1);
  assert.equal(searched[0].id, "home_gyro_ball");
});

test("Wall-clock timer syncs elapsed time accurately across background sleep", () => {
  const store = createStore(makeMemoryStorage());
  let completed = false;
  const ctrl = createTimerController(store, {
    onComplete: () => { completed = true; }
  });

  ctrl.start(60, "휴식", "home_pullup");
  assert.equal(ctrl.timer.running, true);
  assert.equal(ctrl.timer.remaining, 60);

  // Simulate 62 seconds elapsed while screen locked
  ctrl.timer.endTimestamp = Date.now() - 2000;
  ctrl.syncWithClock();
  assert.equal(ctrl.timer.running, false);
  assert.equal(ctrl.timer.remaining, 0);
  assert.equal(completed, true);
});

test("Muscle heatmap maps all 48 exercises & builds today completion report accurately", () => {
  for (const ex of EXERCISES) {
    const mapped = mapExerciseToMuscleRegions(ex);
    const total = mapped.primary.length + mapped.secondary.length + mapped.stretch.length;
    assert.ok(total > 0, `Expected muscle mapping for ${ex.id}`);
  }

  const today = formatLocalDate(new Date());
  const store = createStore(makeMemoryStorage({
    sessionDate: today,
    todayRoutine: {
      date: today,
      title: "리포트 테스트",
      mode: "home",
      items: [
        { id: "home_smr_glute", sets: 2, reps: "45초" },
        { id: "home_band_pullup", sets: 3, reps: "3회" },
        { id: "home_deep_pushup", sets: 3, reps: "13회" },
        { id: "home_forearm_plank", sets: 3, reps: "50초" }
      ]
    },
    records: {
      home_smr_glute: { sets: [{ done: true }, { done: true }], isCompleted: true, rpe: null, lastUpdatedDate: today },
      home_band_pullup: { sets: [{ done: true }, { done: true }, { done: true }], isCompleted: true, rpe: 6, lastUpdatedDate: today },
      home_deep_pushup: { sets: [{ done: true }, { done: true }, { done: true }], isCompleted: true, rpe: 5, lastUpdatedDate: today },
      home_forearm_plank: { sets: [{ done: true }, { done: true }, { done: true }], isCompleted: true, rpe: 4, lastUpdatedDate: today }
    }
  }));

  const report = buildTodayReportData(store);
  assert.equal(report.completedExercises, 4);
  assert.equal(report.totalExercises, 4);
  assert.equal(report.totalSetsDone, 11);
  assert.equal(report.avgRpe, 5);
  assert.equal(report.regionStats.lats.level, "primary");
  assert.equal(report.regionStats.chest.level, "primary");
  assert.equal(report.regionStats.glutes.level, "stretch");
  assert.equal(report.regionStats.hamstrings.level, "rest");
  assert.ok(report.stretchedOnly.includes("둔근"));
  assert.ok(report.recoveryGuide.includes("권장 회복"));
});

test("04:00 KST workout date boundary prevents midnight-to-04:00 double rollover", () => {
  assert.equal(getWorkoutDateStr(new Date(2026, 10, 27, 23, 30, 0)), "2026-11-27");
  assert.equal(getWorkoutDateStr(new Date(2026, 10, 28, 0, 30, 0)), "2026-11-27");
  assert.equal(getWorkoutDateStr(new Date(2026, 10, 28, 3, 59, 0)), "2026-11-27");
  assert.equal(getWorkoutDateStr(new Date(2026, 10, 28, 4, 0, 0)), "2026-11-28");
});

test("Quick-add exercise & bodyCondition check-in sync into history, sTSS, and heatmap", () => {
  const today = getWorkoutDateStr();
  const store = createStore(makeMemoryStorage({
    sessionDate: today,
    todayRoutine: {
      date: today,
      title: "테스트 루틴",
      mode: "home",
      items: [{ id: "home_kb_rdl", sets: 3, reps: "10회", weightKg: 14 }]
    },
    history: [
      {
        date: addDaysLocal(today, -2),
        exercises: [{ id: "home_kb_swing", name: "14kg 케틀벨 스윙", completedSets: 5, actualWeightKg: 14, plannedReps: "15회", rpe: 6, isCompleted: true }]
      }
    ]
  }));

  // 1. Body condition check-in
  store.setBodyCondition(["허리"]);
  assert.equal(store.state.bodyCondition.status, "pain");
  assert.deepEqual(store.state.bodyCondition.painAreas, ["허리"]);

  // 2. Quick-add kettlebell swing 10x10
  const idx = store.addExerciseToTodayRoutine("home_kb_swing", { sets: 10, reps: "10회", weightKg: 14 });
  assert.equal(idx, 1);
  const items = store.getTodayRoutineExercises();
  assert.equal(items.length, 2);
  const swingRec = store.getRecord(items[1], today);
  assert.equal(swingRec.sets.length, 10);
  swingRec.sets.forEach(s => { s.done = true; });
  swingRec.isCompleted = true;
  swingRec.rpe = 7;

  // 3. Payload & history include bodyCondition & added exercise
  const payload = upsertTodayHistory(store, today);
  assert.equal(payload.bodyCondition.status, "pain");
  assert.equal(payload.exercises.length, 2);

  // 4. Previous record lookup strictly excludes today & finds 2 days ago
  const prevSwing = store.getLastRecord("home_kb_swing", items[1].name, today);
  assert.ok(prevSwing);
  assert.equal(prevSwing.date, addDaysLocal(today, -2));

  // 5. Report heatmap & sTSS reflect the 10-set swing
  const report = buildTodayReportData(store);
  assert.equal(report.totalSetsDone, 10);
  assert.ok(report.todayStss > 0);
  assert.equal(report.regionStats.glutes.level, "primary");
});

test("Smart swap, 1:1 Home<->Gym conversion, partial set preservation, Undo & bulk pain replace", () => {
  const today = getWorkoutDateStr();
  const prevDate = addDaysLocal(today, -3);
  const store = createStore(makeMemoryStorage({
    sessionDate: today,
    todayRoutine: {
      date: today,
      title: "홈트 루틴",
      mode: "home",
      items: [
        { id: "home_smr_glute", sets: 2, reps: "45초" },
        { id: "home_deep_pushup", sets: 3, reps: "13회" },
        { id: "home_kb_row", sets: 3, reps: "10회", weightKg: 14 },
        { id: "home_kb_swing", sets: 3, reps: "15회", weightKg: 14 },
        { id: "home_forearm_plank", sets: 3, reps: "50초" }
      ]
    },
    history: [
      {
        date: prevDate,
        exercises: [
          { id: "gym_chest_press", name: "시티드 체스트프레스", completedSets: 3, plannedSets: 3, plannedReps: "12회", actualWeightKg: 45, rpe: 6, isCompleted: true },
          { id: "gym_long_pull", name: "롱 풀 (시티드 로우)", completedSets: 3, plannedSets: 3, plannedReps: "12회", actualWeightKg: 40, rpe: 6, isCompleted: true }
        ]
      }
    ],
    records: {
      // Simulate 1st warmup item already completed before conversion
      home_smr_glute: { sets: [{ done: true }, { done: true }], isCompleted: true, lastUpdatedDate: today },
      // Simulate 1 set already done on home_kb_row before swapping
      home_kb_row: { sets: [{ weightKg: 14, reps: "10회", done: true }, { weightKg: 14, reps: "10회", done: false }, { weightKg: 14, reps: "10회", done: false }], isCompleted: false, lastUpdatedDate: today }
    }
  }));

  // 1. Partial set preservation when swapping home_kb_row mid-exercise -> gym_long_pull
  assert.equal(store.replaceTodayRoutineExercise(2, "gym_long_pull", "variation"), true);
  let items = store.getTodayRoutineExercises();
  assert.equal(items[2].id, "gym_long_pull");
  assert.equal(items[2].swappedFrom, "home_kb_row");
  assert.equal(items[2].swapReason, "variation");
  // Old 1 completed set preserved in state.records.home_kb_row, remaining sets = 3 - 1 = 2!
  assert.equal(store.state.records.home_kb_row.sets.filter(s => s.done).length, 1);
  assert.equal(items[2].defaultSets, 2);
  assert.equal(items[2].defaultWeightKg, 40); // inherited from prev gym_long_pull history!

  // Check payload includes swappedFrom & swapReason
  const logPayload = upsertTodayHistory(store, today);
  assert.equal(logPayload.exercises[2].swappedFrom, "home_kb_row");
  assert.equal(logPayload.exercises[2].swapReason, "variation");

  // 2. Undo restores home_kb_row & clears swappedFrom
  assert.equal(store.undoRoutineSwap(2), true);
  items = store.getTodayRoutineExercises();
  assert.equal(items[2].id, "home_kb_row");
  assert.equal(items[2].swappedFrom, null);

  // 3. Home -> Gym batch toggle (preserves warmup/completed, sets previous weights, converts rest)
  const convRes = store.toggleRoutineMode();
  assert.equal(convRes.targetMode, "gym");
  assert.equal(convRes.convertedCount, 4);
  items = store.getTodayRoutineExercises();
  assert.equal(items[0].id, "home_smr_glute"); // warmup untouched
  assert.equal(items[1].id, "gym_chest_press");
  assert.equal(items[1].defaultWeightKg, 45); // inherited from prev gym_chest_press history!
  assert.equal(items[2].id, "gym_long_pull");
  assert.equal(items[3].id, "gym_leg_curl");
  assert.equal(items[4].id, "gym_plank");

  // Toggle back Gym -> Home restores original home exercises
  const revertRes = store.toggleRoutineMode();
  assert.equal(revertRes.targetMode, "home");
  assert.equal(revertRes.reverted, true);
  items = store.getTodayRoutineExercises();
  assert.equal(items[1].id, "home_deep_pushup");
  assert.equal(items[2].id, "home_kb_row");

  // 4. Pain candidates prioritization & 1-tap bulk pain switch ("허리" on home_kb_swing)
  const swingEx = items[3];
  const homeCands = getSwapCandidates(swingEx, "home", ["허리"]);
  assert.ok(homeCands.length >= 2);
  assert.equal(homeCands[0].ex.id, "home_kickstand_rdl");
  assert.equal(homeCands[0].badgeType, "pain_active");
  const gymCands = getSwapCandidates(swingEx, "gym", ["허리"]);
  assert.ok(gymCands.some(c => c.ex.id === "gym_leg_curl"));

  const bulkCount = store.bulkReplacePainExercises(["허리"]);
  assert.equal(bulkCount, 2);
  items = store.getTodayRoutineExercises();
  assert.equal(items[2].id, "home_inverted_row");
  assert.equal(items[2].swapReason, "pain");
  assert.equal(items[3].id, "home_kickstand_rdl");
  assert.equal(items[3].swapReason, "pain");
});

test("Dislike toggle syncs dislikedExercises, pushes to bottom of candidates, & home_smr maps upper back/lats only", () => {
  const smr = EXERCISES.find(x => x.id === "home_smr");
  assert.equal(smr.name, "폼롤러 등 상부·광배근 이완 (SMR)");
  assert.equal(smr.restSec, 20);
  const smrMap = mapExerciseToMuscleRegions(smr);
  assert.deepEqual(smrMap.stretch, ["traps_rear_delts", "lats"]);

  // Calibrated restSec & unilateral labels
  assert.equal(EXERCISES.find(x => x.id === "home_band_pullup").restSec, 90);
  assert.equal(EXERCISES.find(x => x.id === "home_band_pullup").defaultReps, "4회");
  assert.equal(EXERCISES.find(x => x.id === "home_dips").restSec, 75);
  assert.equal(EXERCISES.find(x => x.id === "gym_leg_press").restSec, 90);
  assert.equal(EXERCISES.find(x => x.id === "gym_leg_curl").restSec, 60);
  assert.equal(EXERCISES.find(x => x.id === "home_kb_glute_bridge").restSec, 45);
  assert.equal(EXERCISES.find(x => x.id === "home_kb_row").defaultReps, "좌우 각 10회");

  const today = getWorkoutDateStr();
  const store = createStore(makeMemoryStorage({ sessionDate: today }));
  assert.equal(store.setExercisePreference("home_kb_floor_2arm", "dislike"), true);
  assert.ok(store.state.dislikedExercises.includes("home_kb_floor_2arm"));

  const cands = getSwapCandidates(EXERCISES.find(x => x.id === "home_deep_pushup"), "home", [], [], store.state.dislikedExercises);
  const disIdx = cands.findIndex(c => c.ex.id === "home_kb_floor_2arm");
  if (disIdx !== -1) {
    assert.equal(cands[disIdx].isDisliked, true);
    assert.ok(cands.slice(0, disIdx).every(c => !c.isDisliked));
  }

  // Toggle off removes from dislikedExercises
  assert.equal(store.setExercisePreference("home_kb_floor_2arm", null), false);
  assert.equal(store.state.dislikedExercises.includes("home_kb_floor_2arm"), false);
});

test("New 10 home exercises (total 58) map cleanly across groups, heatmap, timers & Home<->Gym swaps", () => {
  const newIds = [
    "home_kb_sumo_deadlift",
    "home_kb_reverse_lunge",
    "home_kb_calf_raise",
    "home_kb_clean_press",
    "home_pushup_scapula",
    "home_kb_upright_row",
    "home_inverted_row",
    "home_side_plank",
    "home_bird_dog",
    "home_smr_quad_itb"
  ];
  for (const id of newIds) {
    const ex = EXERCISES.find(x => x.id === id);
    assert.ok(ex, `Missing exercise ${id}`);
    assert.ok(ENRICHED_DB[id] && Array.isArray(ENRICHED_DB[id].phases) && ENRICHED_DB[id].phases.length === 3, `Missing phases for ${id}`);
    const hm = mapExerciseToMuscleRegions(ex);
    assert.ok(hm.primary.length + hm.stretch.length > 0, `Missing heatmap for ${id}`);
  }
  assert.equal(isWarmupOrStretch(EXERCISES.find(x => x.id === "home_smr_quad_itb")), true);
  assert.equal(getMuscleGroup(EXERCISES.find(x => x.id === "home_smr_quad_itb")), null);
  assert.equal(parseTimedSeconds("좌우 각 35초"), 35);
  assert.equal(HOME_TO_GYM_MAP.home_inverted_row[0], "gym_long_pull");
  assert.equal(HOME_TO_GYM_MAP.home_kb_sumo_deadlift[0], "gym_inner_thigh");
  assert.equal(HOME_TO_GYM_MAP.home_kb_reverse_lunge[0], "gym_leg_press");
  assert.equal(HOME_TO_GYM_MAP.home_kb_clean_press[0], "gym_shoulder_press");
});
