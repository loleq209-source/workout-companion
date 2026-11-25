/**
 * RideMate Aerobic & Strength Integrated Fatigue Engine.
 * Preserves cycling CTL/ATL/TSB verbatim; computes local-date sTSS, Strength ATL,
 * Total ATL, 4-part Muscle Freshness %, and Weekly Hard Sets.
 */
import { addDaysLocal, getTodayStr, parseLocalDateNoon } from "./date.mjs";
import { getMuscleGroup } from "./data.mjs";

const RECOVERY_HOURS = { push: 48, pull: 72, legs: 72, core: 36 };
const ATL_ALPHA = 1 - Math.exp(-1 / 7); // ~0.13312

export function computeExerciseLoad(sets, rpe) {
  const s = Number(sets) || 0;
  const r = rpe != null ? Number(rpe) : 0;
  if (s <= 0 || r <= 0) return 0;
  return s * Math.pow(r / 10, 2) * 3.5;
}

export function computeSessionStss(session) {
  if (!session) return 0;
  const exList = session.exercises || session.items || [];
  let sum = 0;
  for (const ex of exList) {
    if (!getMuscleGroup(ex)) continue;
    sum += computeExerciseLoad(ex.completedSets, ex.rpe);
  }
  return Math.round(sum * 10) / 10;
}

export function calculateWorkoutMetrics(history = [], wellness = null, options = {}) {
  const today = options.today || getTodayStr();
  const nowMs = options.nowMs != null ? options.nowMs : Date.now();

  const cyclingAtl = wellness && typeof wellness.atl === "number" ? wellness.atl : 0;
  const cyclingCtl = wellness && typeof wellness.ctl === "number" ? wellness.ctl : null;
  const cyclingTsb =
    wellness && typeof wellness.tsb === "number"
      ? wellness.tsb
      : cyclingCtl !== null
        ? Math.round((cyclingCtl - cyclingAtl) * 10) / 10
        : null;

  const weeklyHardSets = { push: 0, pull: 0, legs: 0, core: 0 };
  const groupFatigue = { push: 0, pull: 0, legs: cyclingAtl * 0.8, core: 0 };
  const dailyLoads = {}; // YYYY-MM-DD (local) -> total load

  const historyArr = Array.isArray(history) ? history : [];
  for (const session of historyArr) {
    if (!session || !session.date) continue;
    const sDate = session.date;

    const sessionTimeMs =
      session.timestamp || session.savedAt
        ? new Date(session.timestamp || session.savedAt).getTime()
        : parseLocalDateNoon(sDate).getTime();
    const safeSessionMs = Number.isNaN(sessionTimeMs)
      ? parseLocalDateNoon(sDate).getTime()
      : sessionTimeMs;
    const hoursElapsed = Math.max(0, (nowMs - safeSessionMs) / (1000 * 3600));

    if (!dailyLoads[sDate]) dailyLoads[sDate] = 0;

    const exList = session.exercises || session.items || [];
    for (const ex of exList) {
      const grp = getMuscleGroup(ex);
      if (!grp) continue;
      const sets = Number(ex.completedSets) || 0;
      const rpe = ex.rpe != null && ex.rpe > 0 ? Number(ex.rpe) : null;
      if (sets <= 0 || rpe === null) continue;

      const load = computeExerciseLoad(sets, rpe);
      dailyLoads[sDate] += load;

      // Weekly hard sets: past 7 days (<= 168h) & RPE >= 6
      if (hoursElapsed <= 7 * 24 && rpe >= 6) {
        weeklyHardSets[grp] += sets;
      }

      // Exponential recovery decay
      const tau = RECOVERY_HOURS[grp] || 48;
      groupFatigue[grp] += load * Math.exp(-hoursElapsed / tau);
    }
  }

  const todayStss = dailyLoads[today] ? Math.round(dailyLoads[today] * 10) / 10 : 0;

  // 7-day exponential decay EWMA over local YYYY-MM-DD dates up to `today`
  let strengthAtl = 0;
  const sortedDates = Object.keys(dailyLoads).filter(d => d <= today).sort();
  if (sortedDates.length > 0) {
    const earliestClamped = addDaysLocal(today, -28);
    let curStr = sortedDates[0] < earliestClamped ? earliestClamped : sortedDates[0];
    // Safety guard max 35 iterations
    for (let guard = 0; guard < 35 && curStr <= today; guard++) {
      const dayLoad = dailyLoads[curStr] || 0;
      strengthAtl = strengthAtl * (1 - ATL_ALPHA) + dayLoad * ATL_ALPHA;
      curStr = addDaysLocal(curStr, 1);
    }
  } else {
    strengthAtl = todayStss * ATL_ALPHA;
  }

  const strengthAtl7d = Math.round(strengthAtl * 10) / 10;
  const totalAtl = Math.round((cyclingAtl + strengthAtl7d) * 10) / 10;

  const muscleFreshness = {};
  for (const grp of ["push", "pull", "legs", "core"]) {
    const fat = groupFatigue[grp] || 0;
    muscleFreshness[grp] = Math.max(15, Math.min(100, Math.round(100 - fat * 2.2)));
  }

  return {
    updatedAt: new Date().toISOString(),
    todayStss,
    strengthAtl7d,
    totalAtl,
    muscleFreshness,
    weeklyHardSets,
    cycling: {
      ctl: cyclingCtl,
      atl: cyclingAtl,
      tsb: cyclingTsb
    }
  };
}
