/**
 * Tab 1 — Screen 1: Today Mission Dashboard Renderer.
 */
import { getKoreanDateTitle } from "../date.mjs";

export function renderDashboard({ store, onSelectExercise }) {
  const state = store.state;
  const items = store.getTodayRoutineExercises();
  const totalSets = items.reduce((acc, ex) => acc + store.getRecord(ex).sets.length, 0);
  const doneSets = items.reduce((acc, ex) => acc + store.getRecord(ex).sets.filter(s => s.done).length, 0);
  const doneExercises = items.filter(ex => store.getRecord(ex).isCompleted).length;

  const dateEl = document.getElementById("dashDateTitle");
  if (dateEl) dateEl.textContent = getKoreanDateTitle();

  // Progress Ring (r = 23, circum = 144.5)
  const circum = 2 * Math.PI * 23;
  const pct = totalSets > 0 ? doneSets / totalSets : 0;
  const ringEl = document.getElementById("dashRingProgress");
  if (ringEl) ringEl.style.strokeDashoffset = String(circum * (1 - pct));
  const ringTextEl = document.getElementById("dashRingText");
  if (ringTextEl) ringTextEl.textContent = `${doneExercises}/${items.length}`;

  // Hero Mission Card (Fixes missing `hero.note` bug!)
  const hero = state.todayRoutine;
  const titleEl = document.getElementById("dashHeroTitle");
  const noteEl = document.getElementById("dashHeroNote");
  const timeEl = document.getElementById("dashHeroTime");
  const badgeEl = document.getElementById("dashHeroBadge");
  if (hero) {
    if (titleEl) titleEl.textContent = hero.title || "오늘의 추천 루틴";
    const noteText =
      hero.note ||
      hero.reason ||
      (hero.focus ? `타깃: ${hero.focus}` : "오늘 컨디션에 맞춘 추천 루틴입니다.");
    if (noteEl) noteEl.textContent = noteText.startsWith("※") ? noteText : `※ ${noteText}`;
    if (timeEl) timeEl.textContent = `⏱️ 약 ${hero.estimatedMinutes || 30}분`;
    if (badgeEl) badgeEl.textContent = `⭐ ${hero.mode === "gym" ? "헬스장 머신" : "홈트레이닝"} · ${hero.date || state.sessionDate}`;
  }

  // Workout Extra Banner (from Drive workout_extra_YYYY-MM-DD.json if present)
  const extraBox = document.getElementById("dashExtraNotice");
  if (extraBox) {
    const extra = state.workoutExtra;
    if (extra && (extra.summary || extra.title || extra.note)) {
      extraBox.textContent = `🚲 추가 활동 반영: ${extra.title || extra.summary || extra.note}`;
      extraBox.classList.remove("hidden");
    } else {
      extraBox.classList.add("hidden");
    }
  }

  // CTA Button text
  const ctaBtn = document.getElementById("dashCtaBtn");
  if (ctaBtn) {
    if (doneExercises === items.length && items.length > 0) {
      ctaBtn.textContent = "🎉 오늘 미션 완료! (다시 보기)";
    } else if (doneSets > 0) {
      ctaBtn.textContent = `▶ 이어서 하기 (${doneExercises}/${items.length})`;
    } else {
      ctaBtn.textContent = "▶ 운동 시작하기";
    }
  }

  const summaryEl = document.getElementById("dashStatusSummary");
  if (summaryEl) summaryEl.textContent = `${doneExercises} / ${items.length} 완료`;

  // Checklist Items
  const listContainer = document.getElementById("dashRoutineList");
  if (!listContainer) return;

  listContainer.innerHTML = items
    .map((ex, idx) => {
      const rec = store.getRecord(ex);
      const isDone = rec.isCompleted;
      const doneSetCount = rec.sets.filter(s => s.done).length;
      const totalSetCount = rec.sets.length;
      const w = (rec.sets[0] && rec.sets[0].weightKg) || ex.defaultWeightKg || 0;
      const r = (rec.sets[0] && rec.sets[0].reps) || ex.defaultReps || "10회";
      const specMeta = `${w > 0 ? `${w}kg · ` : ""}${r} × ${totalSetCount}세트`;

      let badgeHtml = "";
      if (isDone) {
        badgeHtml = `<span class="badge badge-lime">완료${rec.rpe ? ` · RPE ${rec.rpe}` : ""}</span>`;
      } else if (doneSetCount > 0) {
        badgeHtml = `<span class="badge badge-amber">${doneSetCount}/${totalSetCount}세트</span>`;
      } else {
        badgeHtml = `<span class="badge badge-muted">${totalSetCount}세트</span>`;
      }

      return `
        <div class="card-surface row-between dash-card-item ${isDone ? "done" : ""}" data-dash-idx="${idx}">
          <div class="row-gap" style="gap:10px; min-width:0; flex:1;">
            <span class="step-chip ${isDone ? "done" : ""}" style="width:28px; height:28px; font-size:12px;">${isDone ? "✓" : idx + 1}</span>
            <div style="min-width:0; flex:1;">
              <div style="font-size:14px; font-weight:800; color:#ffffff; line-height:1.25;">${ex.name}</div>
              <div style="font-size:11px; color:var(--text-muted); margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                <span style="color:var(--accent); font-weight:700;">${specMeta}</span> · ${ex.targetMuscle}
              </div>
            </div>
          </div>
          <div style="flex-shrink:0; margin-left:6px;">${badgeHtml}</div>
        </div>
      `;
    })
    .join("");

  listContainer.querySelectorAll(".dash-card-item").forEach(card => {
    card.addEventListener("click", () => onSelectExercise(Number(card.dataset.dashIdx)));
  });
}
