/**
 * Today Workout Completion Report Modal Renderer:
 * Anatomical Base Image (1200x896) + Dual-Layer SVG Glow Overlay (mix-blend-mode: screen),
 * 3-Column KPI, Region Breakdown Bars, & Recovery Guide.
 */
import { buildTodayReportData } from "../muscleMap.mjs";
import { resolveAssetBase } from "../data.mjs";

const LEVEL_OPACITY = {
  primary: 0.85,
  secondary: 0.6,
  stretch: 0.65
};

const REGION_ELLIPSES = {
  chest: [
    { cx: 265, cy: 240, rx: 40, ry: 32, rot: -6 },
    { cx: 345, cy: 240, rx: 40, ry: 32, rot: 6 }
  ],
  front_delts: [
    { cx: 200, cy: 225, rx: 28, ry: 24, rot: -20 },
    { cx: 410, cy: 225, rx: 28, ry: 24, rot: 20 }
  ],
  biceps: [
    { cx: 180, cy: 295, rx: 18, ry: 32, rot: 16 },
    { cx: 430, cy: 295, rx: 18, ry: 32, rot: -16 }
  ],
  forearms: [
    { cx: 138, cy: 385, rx: 16, ry: 36, rot: 24 },
    { cx: 472, cy: 385, rx: 16, ry: 36, rot: -24 }
  ],
  core: [
    { cx: 305, cy: 345, rx: 28, ry: 52, rot: 0 },
    { cx: 255, cy: 345, rx: 16, ry: 38, rot: -6 },
    { cx: 355, cy: 345, rx: 16, ry: 38, rot: 6 }
  ],
  quads_hip: [
    { cx: 258, cy: 530, rx: 28, ry: 72, rot: 6 },
    { cx: 352, cy: 530, rx: 28, ry: 72, rot: -6 }
  ],
  traps_rear_delts: [
    { cx: 895, cy: 200, rx: 48, ry: 26, rot: 0 },
    { cx: 795, cy: 225, rx: 26, ry: 22, rot: -20 },
    { cx: 995, cy: 225, rx: 26, ry: 22, rot: 20 }
  ],
  lats: [
    { cx: 845, cy: 295, rx: 34, ry: 48, rot: -14 },
    { cx: 945, cy: 295, rx: 34, ry: 48, rot: 14 }
  ],
  triceps: [
    { cx: 772, cy: 295, rx: 18, ry: 32, rot: 16 },
    { cx: 1018, cy: 295, rx: 18, ry: 32, rot: -16 }
  ],
  lower_back: [
    { cx: 895, cy: 375, rx: 26, ry: 36, rot: 0 }
  ],
  glutes: [
    { cx: 860, cy: 445, rx: 30, ry: 32, rot: 0 },
    { cx: 930, cy: 445, rx: 30, ry: 32, rot: 0 }
  ],
  hamstrings: [
    { cx: 850, cy: 560, rx: 26, ry: 60, rot: 4 },
    { cx: 940, cy: 560, rx: 26, ry: 60, rot: -4 }
  ],
  calves: [
    { cx: 840, cy: 725, rx: 20, ry: 44, rot: 4 },
    { cx: 950, cy: 725, rx: 20, ry: 44, rot: -4 }
  ]
};

function renderMuscleGlowOverlay(regionStats) {
  const groups = Object.entries(REGION_ELLIPSES)
    .map(([regionId, ellipses]) => {
      const stat = regionStats[regionId];
      const level = stat ? stat.level : "rest";
      if (level === "rest") return "";
      const opacity = LEVEL_OPACITY[level] || 0.6;
      const gradId = `grad-${level}`;
      const shapes = ellipses
        .map(e => {
          const tf = e.rot ? ` transform="rotate(${e.rot} ${e.cx} ${e.cy})"` : "";
          return `<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="url(#${gradId})"${tf} />`;
        })
        .join("");
      return `<g data-region="${regionId}" data-level="${level}" opacity="${opacity}" filter="url(#muscleGlow)">${shapes}</g>`;
    })
    .filter(Boolean)
    .join("");

  return `
    <svg viewBox="0 0 1200 896" class="heatmap-overlay-svg" aria-label="전면·후면 근육 발광 오버레이">
      <defs>
        <filter id="muscleGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <radialGradient id="grad-primary" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#a3e635" stop-opacity="1" />
          <stop offset="65%" stop-color="#a3e635" stop-opacity="0.72" />
          <stop offset="100%" stop-color="#a3e635" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="grad-secondary" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#65a30d" stop-opacity="1" />
          <stop offset="65%" stop-color="#65a30d" stop-opacity="0.65" />
          <stop offset="100%" stop-color="#65a30d" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="grad-stretch" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="1" />
          <stop offset="65%" stop-color="#38bdf8" stop-opacity="0.68" />
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
        </radialGradient>
      </defs>
      ${groups}
    </svg>
  `;
}

export function renderCompletionReportModal(store) {
  const body = document.getElementById("reportModalBody");
  if (!body) return;

  const data = buildTodayReportData(store);
  const maxRegionLoad = data.strengthBreakdown.reduce((m, r) => Math.max(m, r.load), 1);
  const baseImgSrc = `${resolveAssetBase()}assets/muscle_map_base.webp`;

  body.innerHTML = `
    <!-- Anatomical Muscle Heatmap (Base Image + SVG Screen-Blend Glow Overlay) -->
    <div class="report-heatmap-box">
      <div class="report-heatmap-stage">
        <img src="${baseImgSrc}" alt="전면·후면 근육 해부도" class="heatmap-base-img" loading="eager">
        ${renderMuscleGlowOverlay(data.regionStats)}
        <span class="heatmap-corner-label" style="left: 10px;">FRONT</span>
        <span class="heatmap-corner-label" style="right: 10px;">BACK</span>
      </div>

      <!-- Compact Legend -->
      <div class="heatmap-legend">
        <span><i class="legend-dot" style="background:#a3e635; box-shadow:0 0 6px rgba(163,230,53,0.6);"></i>주 자극</span>
        <span><i class="legend-dot" style="background:#65a30d;"></i>보조 자극</span>
        <span><i class="legend-dot" style="background:#38bdf8;"></i>이완·가동성</span>
        <span><i class="legend-dot" style="background:#26262a; border:1px solid #3f3f46;"></i>휴식</span>
      </div>
    </div>

    <!-- 3-Column KPI Summary (#1c1c1f) -->
    <div class="grid-3" style="gap: 6px;">
      <div class="metric-tile">
        <div style="font-size:10px; color:var(--text-muted); font-weight:700;">완료 볼륨</div>
        <div class="tabular-nums" style="font-size:13.5px; font-weight:900; color:#ffffff; margin-top:3px;">${data.completedExercises}/${data.totalExercises}종목</div>
        <div class="tabular-nums" style="font-size:10px; color:var(--accent); font-weight:800; margin-top:2px;">${data.totalSetsDone}세트 완료</div>
      </div>
      <div class="metric-tile">
        <div style="font-size:10px; color:var(--text-muted); font-weight:700;">오늘 근력 부하</div>
        <div class="tabular-nums" style="font-size:14px; font-weight:900; color:var(--accent); margin-top:3px;">${data.todayStss.toFixed(1)}</div>
        <div style="font-size:10px; color:var(--text-muted); font-weight:700; margin-top:2px;">sTSS</div>
      </div>
      <div class="metric-tile">
        <div style="font-size:10px; color:var(--text-muted); font-weight:700;">평균 RPE</div>
        <div class="tabular-nums" style="font-size:14px; font-weight:900; color:#ffffff; margin-top:3px;">${data.avgRpe != null ? `RPE ${data.avgRpe}` : "이완 세션"}</div>
        <div class="tabular-nums" style="font-size:10px; color:var(--text-muted); font-weight:700; margin-top:2px;">${data.totalVolumeKg > 0 ? `총 ${data.totalVolumeKg.toLocaleString()}kg` : "맨몸·코어 중심"}</div>
      </div>
    </div>

    <!-- Muscle Region Detail Breakdown -->
    <div style="background:var(--card-2); border:1px solid var(--border); border-radius:14px; padding:11px 12px;" class="stack-2">
      <div class="row-between">
        <strong style="font-size:12.5px; color:#ffffff;">부위별 자극 상세</strong>
        <span style="font-size:10px; color:var(--text-muted);">비중 높은 순</span>
      </div>
      ${
        data.strengthBreakdown.length > 0
          ? `
        <div class="stack-2" style="gap:7px;">
          ${data.strengthBreakdown
            .map(r => {
              const pct = Math.max(10, Math.round((r.load / maxRegionLoad) * 100));
              const barColor = r.level === "primary" ? "#a3e635" : "#65a30d";
              const rpeText = r.avgRpe != null ? ` · 평균 RPE ${r.avgRpe}` : "";
              return `
                <div style="display:flex; flex-direction:column; gap:3px;">
                  <div class="row-between" style="font-size:11px;">
                    <span style="font-weight:800; color:#ffffff;">${r.short}</span>
                    <span class="tabular-nums" style="color:var(--text-soft); font-weight:700;">${r.totalSets}세트${rpeText}</span>
                  </div>
                  <div style="height:6px; border-radius:999px; background:#26262a; overflow:hidden;">
                    <div style="width:${pct}%; height:100%; border-radius:999px; background:${barColor};"></div>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      `
          : `<div style="font-size:11.5px; color:var(--text-muted);">오늘 완료된 근력 세트가 아직 없습니다.</div>`
      }

      ${
        data.stretchedOnly.length > 0
          ? `
        <div style="display:flex; align-items:center; flex-wrap:wrap; gap:5px; padding-top:4px; border-top:1px solid var(--border);">
          <span class="report-cyan-pill">🧘 이완 완료: ${data.stretchedOnly.join("·")}</span>
        </div>
      `
          : ""
      }
    </div>

    <!-- Bottom 1-Line Recovery Guide -->
    <div class="report-recovery-banner">
      💡 ${data.recoveryGuide}
    </div>
  `;
}
