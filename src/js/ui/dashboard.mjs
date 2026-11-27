/**
 * Tab 1 — Screen 1: Today Mission Dashboard Renderer.
 */
import { getKoreanDateTitle, getWorkoutDateStr } from "../date.mjs";
import { findPainAlertAlternative } from "../data.mjs";

export function renderDashboard({ store, sync, onRenderAll, onSelectExercise, showToast }) {
  const state = store.state;
  const items = store.getTodayRoutineExercises();
  const totalSets = items.reduce((acc, ex) => acc + store.getRecord(ex).sets.length, 0);
  const doneSets = items.reduce((acc, ex) => acc + store.getRecord(ex).sets.filter(s => s.done).length, 0);
  const doneExercises = items.filter(ex => store.getRecord(ex).isCompleted).length;

  const dateEl = document.getElementById("dashDateTitle");
  if (dateEl) dateEl.textContent = getKoreanDateTitle(state.sessionDate || getWorkoutDateStr());

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

  // Today AI Briefing Card (yesterdayRecap / cyclingGuide / bonusTip)
  const briefingCard = document.getElementById("dashBriefingCard");
  const briefingRows = document.getElementById("dashBriefingRows");
  if (briefingCard && briefingRows && hero) {
    const rows = [];
    if (hero.yesterdayRecap) {
      rows.push(`<div class="ai-briefing-row"><span class="ai-briefing-label">📌 전날 결산</span><span class="ai-briefing-val">${hero.yesterdayRecap}</span></div>`);
    }
    if (hero.cyclingGuide) {
      rows.push(`<div class="ai-briefing-row"><span class="ai-briefing-label">🚴 오늘 라이딩 가이드</span><span class="ai-briefing-val">${hero.cyclingGuide}</span></div>`);
    }
    if (hero.bonusTip) {
      rows.push(`<div class="ai-briefing-row"><span class="ai-briefing-label">💡 보조 팁</span><span class="ai-briefing-val">${hero.bonusTip}</span></div>`);
    }
    if (rows.length > 0) {
      briefingRows.innerHTML = rows.join("");
      briefingCard.classList.remove("hidden");
    } else {
      briefingRows.innerHTML = "";
      briefingCard.classList.add("hidden");
    }
  } else if (briefingCard) {
    briefingCard.classList.add("hidden");
  }

  // 3-Second Body Condition & Pain Check-In Bar
  const cond = state.bodyCondition || { status: "ok", painAreas: [] };
  const painAreas = Array.isArray(cond.painAreas) ? cond.painAreas : [];
  const statusLbl = document.getElementById("dashConditionStatusLabel");
  if (statusLbl) {
    statusLbl.textContent =
      painAreas.length > 0
        ? `⚠️ ${painAreas.join("·")} 주의 (안전 대체 활성화)`
        : "😊 정상 컨디션";
    statusLbl.style.color = painAreas.length > 0 ? "var(--rose)" : "var(--accent)";
  }
  const chipsWrap = document.getElementById("dashConditionChips");
  if (chipsWrap) {
    chipsWrap.querySelectorAll(".condition-chip").forEach(btn => {
      const c = btn.dataset.cond;
      btn.classList.remove("active-ok", "active-pain");
      if (c === "ok") {
        if (painAreas.length === 0) btn.classList.add("active-ok");
      } else if (painAreas.includes(c)) {
        btn.classList.add("active-pain");
      }
      btn.onclick = () => {
        if (c === "ok") {
          store.setBodyCondition([]);
          showToast("😊 정상 컨디션으로 체크되었습니다.");
        } else {
          const next = painAreas.includes(c)
            ? painAreas.filter(p => p !== c)
            : [...painAreas, c];
          store.setBodyCondition(next);
          showToast(
            next.length > 0
              ? `🩺 [${next.join("·")}] 주의 부위 기록 & 안전 대체 연동됨`
              : "😊 정상 컨디션으로 체크되었습니다."
          );
        }
        if (onRenderAll) onRenderAll();
        if (sync) sync.pushToGoogleDrive(true);
      };
    });
  }

  // Bulk Pain Replacement Button ("🩹 허리 부담 종목 N개 한 번에 대체하기")
  const bulkPainBtn = document.getElementById("dashBulkPainBtn");
  if (bulkPainBtn) {
    const painMatchCount = painAreas.length > 0
      ? items.filter(ex => !store.getRecord(ex).isCompleted && Boolean(findPainAlertAlternative(ex, painAreas))).length
      : 0;
    if (painMatchCount > 0) {
      bulkPainBtn.textContent = `🩹 ${painAreas.join("·")} 부담 종목 ${painMatchCount}개 한 번에 대체하기`;
      bulkPainBtn.classList.remove("hidden");
      bulkPainBtn.onclick = () => {
        const replaced = store.bulkReplacePainExercises(painAreas);
        if (replaced > 0) {
          if (sync) sync.scheduleAutoPush(300);
          if (onRenderAll) onRenderAll();
          if (showToast) showToast(`🩹 ${replaced}개 종목을 안전한 대체 운동으로 일괄 전환했습니다!`);
        }
      };
    } else {
      bulkPainBtn.classList.add("hidden");
    }
  }

  // Screen 1 Routine Mode Conversion Toggle ("🔄 헬스 기구로 변환" / "🔄 홈트로 변환")
  const modeSwapBtn = document.getElementById("dashModeSwapBtn");
  if (modeSwapBtn) {
    const curEffMode = store.getRoutineEffectiveMode ? store.getRoutineEffectiveMode() : "home";
    const isGymMode = curEffMode === "gym";
    modeSwapBtn.textContent = isGymMode ? "🔄 홈트로 변환" : "🔄 헬스 기구로 변환";
    modeSwapBtn.classList.toggle("badge-lime", isGymMode);
    modeSwapBtn.classList.toggle("badge-muted", !isGymMode);
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
  const reportBtn = document.getElementById("dashReportBtn");
  if (reportBtn) {
    reportBtn.classList.toggle("hidden", !(items.length > 0 && doneExercises === items.length));
  }

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
      const restSec = ex.restSec || 60;
      const specMeta = `${w > 0 ? `${w}kg · ` : ""}${totalSetCount}세트 × ${r} · 휴식 ${restSec}초`;
      const painAlt = !isDone ? findPainAlertAlternative(ex, painAreas) : null;

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
              ${ex.reason ? `<div class="dash-reason-line">🎯 ${ex.reason}</div>` : ""}
              ${
                painAlt
                  ? `<button type="button" class="btn-tap dash-pain-alert-btn" data-dash-alt-idx="${idx}" data-alt-id="${painAlt.altId}">🩹 ${painAlt.matchedArea} 주의 · 원탭 대체 → ${painAlt.altName.replace(/^[0-9]+kg\s*/, "")}</button>`
                  : ""
              }
            </div>
          </div>
          <div style="flex-shrink:0; margin-left:6px;">${badgeHtml}</div>
        </div>
      `;
    })
    .join("");

  listContainer.querySelectorAll(".dash-pain-alert-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const idx = Number(btn.dataset.dashAltIdx);
      const altId = btn.dataset.altId;
      if (store.replaceTodayRoutineExercise(idx, altId)) {
        if (sync) sync.scheduleAutoPush(300);
        if (onRenderAll) onRenderAll();
        const replaced = store.getTodayRoutineExercises()[idx];
        if (showToast) showToast(`🩹 ${(replaced && replaced.name) || altId}(으)로 안전 대체되었습니다.`);
      }
    });
  });

  listContainer.querySelectorAll(".dash-card-item").forEach(card => {
    card.addEventListener("click", () => onSelectExercise(Number(card.dataset.dashIdx)));
  });
}
