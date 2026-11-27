import test from "node:test";
import assert from "node:assert/strict";

import { formatLocalDate, addDaysLocal, parseLocalDateNoon } from "../src/js/date.mjs";
import { EXERCISES, getMuscleGroup, isWarmupOrStretch, resolveAssetBase } from "../src/js/data.mjs";
import { calculateWorkoutMetrics, computeSessionStss } from "../src/js/metrics.mjs";
import { createStore } from "../src/js/store.mjs";
import { upsertTodayHistory, applyLoadedDriveData } from "../src/js/sync.mjs";
import { createTimerController } from "../src/js/timer.mjs";

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

test("Data mapping classifies all 48 exercises cleanly & preserves legacy aliases", () => {
  assert.equal(EXERCISES.length, 48);
  assert.equal(EXERCISES.filter(x => x.mode === "home").length, 36);
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
