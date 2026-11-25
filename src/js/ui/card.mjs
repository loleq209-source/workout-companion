/**
 * Tab 1 — Screen 2: Ultra-Compact 1-Screen Sequential Workout Card,
 * Interactive Set Undo Dots, Swipe Navigation, and Step Bar.
 */
import { ENRICHED_DB, getGuideMedia, isWarmupOrStretch } from "../data.mjs";
import { getTodayStr } from "../date.mjs";
import { triggerNativeHaptic } from "../bridge.mjs";

function stepRepsText(repsStr, delta) {
  const s = String(repsStr || "10회").trim();
  const isSec = s.includes("초");
  const isMin = !isSec && s.includes("분");
  const step = isSec ? delta * 5 : delta;
  const m = s.match(/^(.*?)(\d+)(?:\s*~\s*(\d+))?(.*)$/);
  if (!m) return delta > 0 ? "11회" : "9회";
  const prefix = m[1];
  const n1 = parseInt(m[2], 10);
  const n2 = m[3] ? parseInt(m[3], 10) : null;
  const suffix = m[4] || (isSec ? "초" : isMin ? "분" : "회");
  const baseNum = n2 !== null ? (delta > 0 ? n2 : n1) : n1;
  const minVal = isSec ? 5 : 1;
  const nextVal = Math.max(minVal, baseNum + step);
  return `${prefix}${nextVal}${suffix}`;
}

export function updateTimerDom(timer) {
  const ring = document.getElementById("timerRingProgress");
  const timeText = document.getElementById("timerRingTime");
  const labelText = document.getElementById("timerRingLabel");
  const toggleBtn = document.getElementById("timerToggleBtn");

  if (timeText) {
    const m = String(Math.floor(timer.remaining / 60)).padStart(2, "0");
    const s = String(timer.remaining % 60).padStart(2, "0");
    timeText.textContent = `${m}:${s}`;
  }
  if (ring) {
    const circum = 2 * Math.PI * 28; // 175.9
    const ratio = timer.duration > 0 ? Math.max(0, Math.min(1, timer.remaining / timer.duration)) : 1;
    ring.style.strokeDashoffset = String(circum * (1 - ratio));
  }
  if (labelText) {
    labelText.textContent = timer.running ? "휴식 중" : "휴식";
  }
  if (toggleBtn) {
    toggleBtn.textContent = timer.running ? "⏸ 정지" : "⏱️ 시작";
  }
}

export function createCardController({ store, timerCtrl, sync, modals, onRenderAll, showToast }) {
  function renderCardStepBar() {
    const items = store.getTodayRoutineExercises();
    const stepBar = document.getElementById("cardStepBar");
    if (!stepBar) return;

    stepBar.innerHTML = `
      <div class="step-bar-inner">
        ${items
          .map((ex, idx) => {
            const rec = store.getRecord(ex);
            const isDone = rec.isCompleted;
            const isCurrent = idx === store.state.todayCardIndex;
            return `
              <button type="button" class="btn-tap step-chip ${isCurrent ? "active" : ""} ${isDone && !isCurrent ? "done" : ""}" data-step-idx="${idx}">
                ${isDone && !isCurrent ? "✓" : idx + 1}
              </button>
            `;
          })
          .join("")}
      </div>
    `;

    stepBar.querySelectorAll(".step-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        store.state.todayCardIndex = Number(chip.dataset.stepIdx);
        onRenderAll();
      });
    });
  }

  function renderFocusedCard() {
    const items = store.getTodayRoutineExercises();
    if (!items.length) return;
    if (store.state.todayCardIndex >= items.length) store.state.todayCardIndex = 0;

    const ex = items[store.state.todayCardIndex] || items[0];
    const rec = store.getRecord(ex);
    const enriched = ENRICHED_DB[ex.id] || null;
    const media = getGuideMedia(ex.id);

    // Sync idle preview countdown with active exercise's restSec
    timerCtrl.previewExerciseRest(ex);
    const t = timerCtrl.timer;

    const activeSetIdx = rec.sets.findIndex(s => !s.done);
    const allDone = activeSetIdx === -1;
    const curSetNum = allDone ? rec.sets.length : activeSetIdx + 1;

    const circum = 2 * Math.PI * 28;
    const ratio = t.duration > 0 ? Math.max(0, Math.min(1, t.remaining / t.duration)) : 1;
    const min = String(Math.floor(t.remaining / 60)).padStart(2, "0");
    const sec = String(t.remaining % 60).padStart(2, "0");

    const currentWeight = rec.sets[0] && rec.sets[0].weightKg != null ? rec.sets[0].weightKg : (ex.defaultWeightKg || 0);
    const currentReps = (rec.sets[0] && rec.sets[0].reps) || ex.defaultReps || "10회";

    const isStretch = isWarmupOrStretch(ex);
    const remainingSetsCount = rec.sets.filter(s => !s.done).length;
    const isLastRemainingSet = remainingSetsCount <= 1;

    // Interactive set dots: tap any dot to toggle/undo that set
    const setDotsHtml = rec.sets
      .map((s, i) => {
        const bg = s.done ? "var(--accent)" : i === activeSetIdx ? "#ffffff" : "#38383f";
        return `
          <button type="button" class="set-dot-btn" data-card-action="toggle-set" data-set-idx="${i}" title="${i + 1}세트 ${s.done ? "해제" : "완료"}">
            <span class="set-dot-visual" style="background:${bg};"></span>
          </button>
        `;
      })
      .join("");

    let middleControlsHtml = "";
    if (isStretch) {
      middleControlsHtml = `
        <div style="background:var(--card-2); border:1px solid var(--border); border-radius:10px; padding:6px 10px; display:flex; align-items:center; justify-content:space-between; margin-top:2px;">
          <span style="font-size:11.5px; font-weight:800; color:var(--text-soft);">
            ${curSetNum} / ${rec.sets.length}세트 · 목표 ${currentReps}
          </span>
          <div class="row-gap" style="gap:2px;">${setDotsHtml}</div>
        </div>
      `;
    } else {
      middleControlsHtml = `
        <div style="margin-top:2px; background:#0e0e11; border:1px solid var(--border); border-radius:12px; padding:6px 10px; display:flex; align-items:center; gap:8px;">
          <!-- Left: Compact Circular Rest Timer (62x62) -->
          <div style="flex:0 0 74px; display:flex; flex-direction:column; align-items:center; gap:2px;">
            <div style="position:relative; width:62px; height:62px; display:flex; align-items:center; justify-content:center;">
              <svg width="62" height="62" viewBox="0 0 68 68" style="transform: rotate(-90deg);">
                <circle cx="34" cy="34" r="28" fill="none" stroke="#222226" stroke-width="5" />
                <circle id="timerRingProgress" cx="34" cy="34" r="28" fill="none" stroke="#a3e635" stroke-width="5" stroke-linecap="round"
                  style="stroke-dasharray:${circum.toFixed(1)}; stroke-dashoffset:${(circum * (1 - ratio)).toFixed(1)}; transition: stroke-dashoffset 0.3s linear;" />
              </svg>
              <div style="position:absolute; text-align:center;">
                <div id="timerRingTime" class="tabular-nums" style="font-size:14px; font-weight:900; color:#ffffff;">${min}:${sec}</div>
                <div id="timerRingLabel" style="font-size:8px; font-weight:800; color:var(--text-muted); max-width:48px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.running ? "휴식 중" : "휴식"}</div>
              </div>
            </div>
            <div class="row-gap" style="gap:3px; width:100%;">
              <button id="timerToggleBtn" type="button" class="btn-tap" style="flex:1; height:22px; border-radius:6px; font-size:9.5px; font-weight:800; border:1px solid var(--accent); background:var(--accent-bg); color:var(--accent); padding:0;">
                ${t.running ? "⏸ 정지" : "⏱️ 시작"}
              </button>
              <button type="button" data-card-action="timer-add" class="btn-tap btn-secondary" style="flex:1; height:22px; border-radius:6px; font-size:9.5px; padding:0;">
                +15초
              </button>
            </div>
          </div>

          <!-- Right: Interactive Set Dots + Steppers -->
          <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:4px;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <span style="font-size:11px; font-weight:800; color:var(--text-soft);">${curSetNum} / ${rec.sets.length}세트 <span style="font-size:9.5px; color:var(--text-muted); font-weight:600;">(점 탭=되돌림)</span></span>
              <div class="row-gap" style="gap:1px;">${setDotsHtml}</div>
            </div>

            <div style="background:var(--card); border:1px solid var(--border); border-radius:8px; padding:3px 8px; display:flex; align-items:center; justify-content:space-between;">
              <div>
                <div style="font-size:8px; color:var(--text-muted); font-weight:700;">중량</div>
                <div id="batchWeightDisplay" class="tabular-nums" style="font-size:12px; font-weight:900; color:#fff;">${currentWeight > 0 ? `${currentWeight}kg` : "맨몸/밴드"}</div>
              </div>
              <div class="row-gap" style="gap:3px;">
                <button type="button" data-card-action="step-weight" data-delta="-2" class="btn-tap stepper-btn" style="width:24px; height:24px; font-size:13px; border-radius:6px;">-</button>
                <button type="button" data-card-action="step-weight" data-delta="2" class="btn-tap stepper-btn" style="width:24px; height:24px; font-size:13px; border-radius:6px;">+</button>
              </div>
            </div>

            <div style="background:var(--card); border:1px solid var(--border); border-radius:8px; padding:3px 8px; display:flex; align-items:center; justify-content:space-between;">
              <div>
                <div style="font-size:8px; color:var(--text-muted); font-weight:700;">횟수/시간</div>
                <div id="batchRepsDisplay" class="tabular-nums" style="font-size:12px; font-weight:900; color:#fff;">${currentReps}</div>
              </div>
              <div class="row-gap" style="gap:3px;">
                <button type="button" data-card-action="step-reps" data-delta="-1" class="btn-tap stepper-btn" style="width:24px; height:24px; font-size:13px; border-radius:6px;">-</button>
                <button type="button" data-card-action="step-reps" data-delta="1" class="btn-tap stepper-btn" style="width:24px; height:24px; font-size:13px; border-radius:6px;">+</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    let ctaButtonHtml = "";
    if (isStretch) {
      if (!allDone) {
        const btnText = isLastRemainingSet ? "✅ 종목 완료" : `✅ ${curSetNum}세트 완료`;
        ctaButtonHtml = `
          <button id="cardSetCompleteBtn" type="button" class="btn-tap btn-primary" style="margin-top:4px; height:42px; border-radius:12px; font-size:13.5px;">
            ${btnText}
          </button>
        `;
      } else {
        ctaButtonHtml = `
          <button id="cardSetCompleteBtn" type="button" class="btn-tap btn-primary" style="margin-top:4px; height:42px; border-radius:12px; font-size:13.5px; background:var(--amber-bright); color:#050507;">
            ✅ 종목 완료 (다음 종목 이동)
          </button>
        `;
      }
    } else if (!allDone) {
      ctaButtonHtml = `
        <button id="cardSetCompleteBtn" type="button" class="btn-tap btn-primary" style="margin-top:4px; height:42px; border-radius:12px; font-size:13.5px;">
          ✅ ${curSetNum}세트 완료 · ${ex.restSec || 60}초 휴식 시작
        </button>
      `;
    } else {
      const rpeLabel = rec.rpe != null ? ` · 현재 RPE ${rec.rpe}` : "";
      ctaButtonHtml = `
        <button id="cardSetCompleteBtn" type="button" class="btn-tap btn-primary" style="margin-top:4px; height:42px; border-radius:12px; font-size:13.5px; background:var(--amber-bright); color:#050507;">
          🎉 전 세트 완료 (RPE 강도 기록${rpeLabel})
        </button>
      `;
    }

    const phases = enriched && Array.isArray(enriched.phases) ? enriched.phases : [];
    const doCue = enriched && enriched.doCue ? enriched.doCue : ex.prep || "통제된 자세로 자극 집중";
    const dontCue = enriched && enriched.dontCue ? enriched.dontCue : "반동을 쓰거나 무리한 가동범위 주의";
    const tempo = enriched && enriched.tempo ? enriched.tempo : ex.tempo || "자연스러운 템포";
    const painAlts = enriched && Array.isArray(enriched.painAlternatives) ? enriched.painAlternatives : [];
    const firstAlt = painAlts.length > 0 ? painAlts[0] : null;

    const guideCardHtml = `
      <div class="card-surface" style="padding:8px 10px; display:flex; flex-direction:column; gap:5px; border-radius:14px; margin-top:4px;">
        ${
          phases.length > 0
            ? `
          <div style="display:flex; flex-direction:column; gap:4px;">
            ${phases
              .map(
                (p, pIdx) => `
              <div style="display:flex; align-items:flex-start; gap:5px; font-size:11.5px; line-height:1.35;">
                <span style="display:inline-flex; align-items:center; justify-content:center; width:15px; height:15px; border-radius:50%; background:var(--accent-bg); color:var(--accent); font-size:9.5px; font-weight:900; flex-shrink:0; margin-top:1px;">
                  ${p.step || pIdx + 1}
                </span>
                <div style="flex:1; min-width:0; color:var(--text-soft);">
                  <strong style="color:#ffffff; font-weight:800;">[${p.title}]</strong>
                  <span>${p.cue}</span>
                  ${p.breath ? `<span style="color:var(--text-muted); font-size:10px; margin-left:3px; white-space:nowrap;">💨 ${p.breath}</span>` : ""}
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        `
            : `
          <div style="font-size:11.5px; color:var(--text-soft); line-height:1.35;">
            <strong style="color:#ffffff;">[동작 요약]</strong> ${ex.prep || "올바른 자세를 유지하며 통제된 속도로 진행합니다."}
          </div>
        `
        }

        <div style="background:var(--card-2); border:1px solid var(--border); border-radius:9px; padding:5px 8px; display:flex; flex-direction:column; gap:3px;">
          <div style="display:flex; align-items:flex-start; gap:5px; font-size:11px; line-height:1.35;">
            <span style="color:var(--accent); font-weight:900; flex-shrink:0;">⭕</span>
            <span style="color:var(--text-soft);">${doCue}</span>
          </div>
          <div style="display:flex; align-items:flex-start; gap:5px; font-size:11px; line-height:1.35;">
            <span style="color:var(--rose); font-weight:900; flex-shrink:0;">❌</span>
            <span style="color:var(--text-soft);">${dontCue}</span>
          </div>
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; height:32px; background:var(--card-2); border:1px solid var(--border); border-radius:9px; padding:0 8px; gap:6px;">
          <div style="display:flex; align-items:center; gap:5px; min-width:0; flex-shrink:1;">
            <span style="font-size:11px; font-weight:800; color:var(--text-soft); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">⏱ ${tempo}</span>
            ${enriched && enriched.unilateral ? `<span class="badge badge-purple" style="font-size:9.5px; padding:1px 5px; flex-shrink:0;">좌우 각각</span>` : ""}
          </div>
          ${
            firstAlt
              ? `
            <button type="button" data-card-action="switch-alt" data-alt-id="${firstAlt.altId}" class="btn-tap" style="font-size:10.5px; font-weight:800; color:var(--amber-bright); background:rgba(250,204,21,0.1); border:1px solid rgba(250,204,21,0.3); border-radius:7px; height:24px; padding:0 7px; display:flex; align-items:center; gap:3px; white-space:nowrap; max-width:62%; overflow:hidden; text-overflow:ellipsis; flex-shrink:0;">
              <span style="overflow:hidden; text-overflow:ellipsis;">🩹 ${firstAlt.area} 불편 시 → ${firstAlt.altName.replace(/^[0-9]+kg\s*/, "")}</span>
            </button>
          `
              : `<span style="font-size:10px; color:var(--text-muted); flex-shrink:0;">표준 자세 권장</span>`
          }
        </div>
      </div>
    `;

    const cardContainer = document.getElementById("cardMainContent");
    if (!cardContainer) return;

    cardContainer.innerHTML = `
      ${
        media
          ? `
        <div id="card3CutImgBox" style="position:relative; width:100%; height:124px; background:#000000; border-radius:12px; overflow:hidden; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; cursor:zoom-in;">
          <img src="${media.full}" alt="${ex.name} 3컷 동작" loading="eager" style="width:100%; height:100%; object-fit:contain; display:block;">
          <span style="position:absolute; right:8px; bottom:6px; font-size:9px; font-weight:800; background:rgba(0,0,0,0.78); color:var(--accent); border:1px solid rgba(163,230,53,0.3); border-radius:5px; padding:1px 6px;">🔍 단계별 재생·확대</span>
        </div>
      `
          : ""
      }

      <!-- 2-Row Non-Truncated Title Header -->
      <div style="display:flex; flex-direction:column; gap:2px; margin-top:2px;">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:6px;">
          <span style="font-size:16px; font-weight:900; color:#ffffff; word-break:keep-all; line-height:1.25; letter-spacing:-0.3px;">${ex.name}</span>
          ${enriched && enriched.unilateral ? `<span class="badge badge-purple" style="font-size:9.5px; padding:1px 5px; flex-shrink:0; white-space:nowrap; margin-top:1px;">↔ 양쪽</span>` : ""}
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; font-size:11px;">
          <span class="badge badge-muted" style="font-size:9.5px; padding:1px 5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:55%; flex-shrink:0;">${ex.equipment}</span>
          <span style="font-size:11px; font-weight:800; color:var(--accent); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:right; min-width:0; flex:1;">${ex.targetMuscle}</span>
        </div>
      </div>

      ${middleControlsHtml}
      ${ctaButtonHtml}
      ${guideCardHtml}
    `;

    bindCardActions(ex, rec);
  }

  function bindCardActions(ex, rec) {
    const container = document.getElementById("cardMainContent");
    if (!container) return;

    const imgWrap = document.getElementById("card3CutImgBox");
    if (imgWrap) {
      imgWrap.addEventListener("click", () => {
        modals.openExerciseGuideModal(ex, "full");
      });
    }

    container.querySelectorAll("[data-card-action]").forEach(el => {
      el.addEventListener("click", () => {
        const act = el.dataset.cardAction;
        if (act === "toggle-set") {
          const sIdx = Number(el.dataset.setIdx);
          if (!Array.isArray(rec.sets) || sIdx < 0 || sIdx >= rec.sets.length) return;
          store.markUserInteractedToday();
          rec.sets[sIdx].done = !rec.sets[sIdx].done;
          rec.lastUpdatedDate = getTodayStr();
          rec.isCompleted = rec.sets.every(s => s.done);
          if (!rec.isCompleted) rec.rpe = null;
          store.refreshMetrics();
          store.persistState();
          sync.scheduleAutoPush(600);
          renderCardStepBar();
          renderFocusedCard();
          showToast(rec.sets[sIdx].done ? `✅ ${sIdx + 1}세트 체크` : `↺ ${sIdx + 1}세트 되돌림`);
        } else if (act === "switch-alt") {
          const altId = el.dataset.altId;
          const items = store.getTodayRoutineExercises();
          const targetIdx = items.findIndex(x => x.id === altId);
          if (targetIdx !== -1) {
            store.state.todayCardIndex = targetIdx;
            onRenderAll();
            showToast(`🩹 ${items[targetIdx].name}(으)로 이동했습니다.`);
          } else {
            const ok = store.replaceTodayRoutineExercise(store.state.todayCardIndex, altId);
            if (ok) {
              sync.scheduleAutoPush(500);
              onRenderAll();
              const updated = store.getTodayRoutineExercises()[store.state.todayCardIndex];
              showToast(`🩹 ${(updated && updated.name) || altId}(으)로 대체 전환되었습니다.`);
            } else {
              showToast(`대체 종목(${altId}) 정보를 찾을 수 없습니다.`);
            }
          }
        } else if (act === "timer-add") {
          timerCtrl.addSeconds(15);
        } else if (act === "step-weight") {
          const delta = Number(el.dataset.delta);
          store.markUserInteractedToday();
          const curW = rec.sets[0] && rec.sets[0].weightKg != null ? rec.sets[0].weightKg : (ex.defaultWeightKg || 0);
          const nextW = Math.max(0, curW + delta);
          rec.sets.forEach(s => { s.weightKg = nextW; });
          rec.lastUpdatedDate = getTodayStr();
          store.persistState();
          sync.scheduleAutoPush(800);
          renderFocusedCard();
        } else if (act === "step-reps") {
          const delta = Number(el.dataset.delta);
          store.markUserInteractedToday();
          const curR = (rec.sets[0] && rec.sets[0].reps) || ex.defaultReps || "10회";
          const nextR = stepRepsText(curR, delta);
          rec.sets.forEach(s => { s.reps = nextR; });
          rec.lastUpdatedDate = getTodayStr();
          store.persistState();
          sync.scheduleAutoPush(800);
          renderFocusedCard();
        }
      });
    });

    const timerBtn = document.getElementById("timerToggleBtn");
    if (timerBtn) {
      timerBtn.addEventListener("click", () => {
        timerCtrl.toggle(ex.restSec || 60, `${ex.name} 휴식`, ex.id);
      });
    }

    const completeBtn = document.getElementById("cardSetCompleteBtn");
    if (completeBtn) {
      completeBtn.addEventListener("click", () => {
        const isStretch = isWarmupOrStretch(ex);
        const nextSetIdx = rec.sets.findIndex(s => !s.done);
        store.markUserInteractedToday();

        if (nextSetIdx !== -1) {
          rec.sets[nextSetIdx].done = true;
          rec.lastUpdatedDate = getTodayStr();
          triggerNativeHaptic();
          rec.isCompleted = rec.sets.every(s => s.done);
          store.refreshMetrics();
          store.persistState();

          if (!isStretch) {
            timerCtrl.start(ex.restSec || 60, `${ex.name} ${nextSetIdx + 1}세트 후 휴식`, ex.id);
          }

          if (rec.isCompleted) {
            if (isStretch) {
              modals.directFinishExercise(ex, rec);
            } else {
              modals.openRpeBottomSheet(ex, rec);
            }
          } else {
            sync.scheduleAutoPush(800);
            renderFocusedCard();
            renderCardStepBar();
          }
        } else {
          if (isStretch) {
            modals.directFinishExercise(ex, rec);
          } else {
            modals.openRpeBottomSheet(ex, rec);
          }
        }
      });
    }
  }

  function navigateCardWithSwipe(direction) {
    const items = store.getTodayRoutineExercises();
    if (!items || !items.length) return;

    const nextIdx = store.state.todayCardIndex + direction;
    const cardContent = document.getElementById("cardMainContent");

    if (nextIdx < 0 || nextIdx >= items.length) {
      if (cardContent) {
        const bounceClass = direction > 0 ? "card-bounce-end" : "card-bounce-start";
        cardContent.classList.remove("card-bounce-start", "card-bounce-end");
        cardContent.classList.add(bounceClass);
        setTimeout(() => cardContent.classList.remove(bounceClass), 200);
      }
      return;
    }

    if (!cardContent) {
      store.state.todayCardIndex = nextIdx;
      renderCardStepBar();
      renderFocusedCard();
      return;
    }

    const outClass = direction > 0 ? "card-slide-out-left" : "card-slide-out-right";
    const inClass = direction > 0 ? "card-slide-in-right" : "card-slide-in-left";

    cardContent.classList.remove(
      "card-slide-out-left",
      "card-slide-out-right",
      "card-slide-in-left",
      "card-slide-in-right",
      "card-bounce-start",
      "card-bounce-end"
    );
    cardContent.classList.add(outClass);

    setTimeout(() => {
      store.state.todayCardIndex = nextIdx;
      renderCardStepBar();
      renderFocusedCard();

      const stepBar = document.getElementById("cardStepBar");
      const activeChip = stepBar && stepBar.querySelector(`.step-chip[data-step-idx="${nextIdx}"]`);
      if (activeChip && activeChip.scrollIntoView) {
        activeChip.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }

      const newContent = document.getElementById("cardMainContent");
      if (newContent) {
        newContent.classList.remove(outClass);
        newContent.classList.add(inClass);
        setTimeout(() => newContent.classList.remove(inClass), 150);
      }
    }, 80);
  }

  function initSwipeGesture() {
    const viewCard = document.getElementById("viewCard");
    if (!viewCard) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let cancelled = false;

    viewCard.addEventListener(
      "touchstart",
      e => {
        if (e.touches.length !== 1) {
          cancelled = true;
          return;
        }
        const rpeOpen = !document.getElementById("rpeBottomSheet")?.classList.contains("hidden");
        const zoomOpen = !document.getElementById("zoomModal")?.classList.contains("hidden");
        const addOpen = !document.getElementById("addExModal")?.classList.contains("hidden");
        if (rpeOpen || zoomOpen || addOpen) {
          cancelled = true;
          return;
        }
        if (e.target.closest("button, input, select, textarea, .stepper-btn, .set-dot-btn, .btn-tap, [data-card-action], #cardStepBar")) {
          cancelled = true;
          return;
        }
        const touch = e.touches[0];
        if (touch.clientX <= 24 || touch.clientX >= window.innerWidth - 24) {
          cancelled = true;
          return;
        }
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
        cancelled = false;
      },
      { passive: true }
    );

    viewCard.addEventListener(
      "touchmove",
      e => {
        if (cancelled || e.touches.length !== 1) return;
        const touch = e.touches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        if (Math.abs(dy) > 15 && Math.abs(dy) >= Math.abs(dx)) {
          cancelled = true;
        }
      },
      { passive: true }
    );

    viewCard.addEventListener(
      "touchend",
      e => {
        if (cancelled) return;
        const touch = e.changedTouches[0];
        if (!touch) return;
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        const dt = Date.now() - touchStartTime;
        if (dt > 800) return;
        if (Math.abs(dx) <= Math.abs(dy) * 1.4) return;
        if (dx <= -55) navigateCardWithSwipe(1);
        else if (dx >= 55) navigateCardWithSwipe(-1);
      },
      { passive: true }
    );
  }

  return {
    renderCardStepBar,
    renderFocusedCard,
    navigateCardWithSwipe,
    initSwipeGesture
  };
}
