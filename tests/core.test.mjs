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

test("Data mapping classifies all 44 exercises cleanly", () => {
  assert.equal(EXERCISES.length, 44);
  const legPress = EXERCISES.find(x => x.id === "gym_leg_press");
  const legCurl = EXERCISES.find(x => x.id === "gym_leg_curl");
  const pullup = EXERCISES.find(x => x.id === "home_pullup");
  const pushup = EXERCISES.find(x => x.id === "home_deep_pushup");
  const smr = EXERCISES.find(x => x.id === "home_smr_back");

  assert.equal(getMuscleGroup(legPress), "legs");
  assert.equal(getMuscleGroup(legCurl), "legs");
  assert.equal(getMuscleGroup(pullup), "pull");
  assert.equal(getMuscleGroup(pushup), "push");
  assert.equal(getMuscleGroup(smr), null);
  assert.equal(isWarmupOrStretch(smr), true);
  assert.equal(getMuscleGroup({ id: "custom_1", category: "상체 밀기" }), "push");
  assert.equal(getMuscleGroup({ id: "custom_2", category: "하체" }), "legs");
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
        items: [{ id: "home_pullup", sets: 3, reps: "2회" }]
      },
      records: {
        home_pullup: {
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
  assert.equal(store.state.records.home_pullup.isCompleted, false);
  assert.equal(store.state.records.home_pullup.rpe, null);
  assert.equal(store.state.records.home_pullup.preference, "like");
  assert.ok(store.state.records.home_pullup.sets.every(s => s.done === false));

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
        items: [{ id: "home_pullup", sets: 2, reps: "5회" }]
      },
      history: [{ date: yesterday, exercises: [{ id: "home_pullup", completedSets: 3, isCompleted: true, rpe: 7 }] }],
      records: {
        home_pullup: {
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
