/**
 * Today Workout Completion Report Modal Renderer:
 * Front/Back Inline Muscle Heatmap SVG, 3-Column KPI, Region Breakdown Bars, & Recovery Guide.
 */
import { buildTodayReportData } from "../muscleMap.mjs";

const LEVEL_COLORS = {
  primary: "#a3e635",
  secondary: "#4d7c0f",
  stretch: "#38bdf8",
  rest: "#26262a"
};

function regionStyle(regionStats, id) {
  const r = regionStats[id];
  const level = r ? r.level : "rest";
  const fill = LEVEL_COLORS[level] || LEVEL_COLORS.rest;
  const filter = level === "primary" ? 'style="filter: drop-shadow(0 0 5px rgba(163,230,53,0.55));"' : "";
  return `fill="${fill}" ${filter}`;
}

function renderFrontSvg(regionStats) {
  return `
    <svg viewBox="0 0 160 300" class="heatmap-svg" aria-label="전면 근육 히트맵">
      <!-- Head & Neck Silhouette -->
      <circle cx="80" cy="22" r="13" fill="#1c1c1f" stroke="#323238" stroke-width="1.2" />
      <rect x="73" y="34" width="14" height="10" rx="4" fill="#1c1c1f" />
      <!-- Pelvis / Knee / Foot Silhouette -->
      <path d="M58 148 L102 148 L95 166 L65 166 Z" fill="#1c1c1f" />
      <ellipse cx="64" cy="224" rx="8" ry="6" fill="#1c1c1f" />
      <ellipse cx="96" cy="224" rx="8" ry="6" fill="#1c1c1f" />
      <path d="M57 232 L71 232 L68 278 L58 278 Z" fill="#1c1c1f" />
      <path d="M89 232 L103 232 L102 278 L92 278 Z" fill="#1c1c1f" />
      <ellipse cx="61" cy="285" rx="9" ry="5" fill="#1c1c1f" />
      <ellipse cx="99" cy="285" rx="9" ry="5" fill="#1c1c1f" />

      <!-- Front/Lateral Delts -->
      <g data-region="front_delts" ${regionStyle(regionStats, "front_delts")}>
        <path d="M48 48 Q34 50 32 68 L44 74 L52 54 Z" />
        <path d="M112 48 Q126 50 128 68 L116 74 L108 54 Z" />
      </g>

      <!-- Chest (Pectorals) -->
      <g data-region="chest" ${regionStyle(regionStats, "chest")}>
        <path d="M53 50 L78 52 L78 82 Q60 84 48 73 Z" />
        <path d="M107 50 L82 52 L82 82 Q100 84 112 73 Z" />
      </g>

      <!-- Biceps -->
      <g data-region="biceps" ${regionStyle(regionStats, "biceps")}>
        <path d="M32 72 L43 76 L39 106 L28 102 Z" />
        <path d="M128 72 L117 76 L121 106 L132 102 Z" />
      </g>

      <!-- Forearms -->
      <g data-region="forearms" ${regionStyle(regionStats, "forearms")}>
        <path d="M27 106 L38 109 L31 144 L21 141 Z" />
        <path d="M133 106 L122 109 L129 144 L139 141 Z" />
      </g>

      <!-- Core (Rectus Abdominis & Obliques) -->
      <g data-region="core" ${regionStyle(regionStats, "core")}>
        <rect x="65" y="86" width="13" height="16" rx="3" />
        <rect x="82" y="86" width="13" height="16" rx="3" />
        <rect x="65" y="105" width="13" height="16" rx="3" />
        <rect x="82" y="105" width="13" height="16" rx="3" />
        <rect x="66" y="124" width="28" height="18" rx="5" />
        <path d="M52 84 L62 88 L62 138 L55 134 Z" opacity="0.88" />
        <path d="M108 84 L98 88 L98 138 L105 134 Z" opacity="0.88" />
      </g>

      <!-- Quads & Hip Flexors -->
      <g data-region="quads_hip" ${regionStyle(regionStats, "quads_hip")}>
        <path d="M54 156 L77 166 L73 216 L55 214 Q50 185 54 156 Z" />
        <path d="M106 156 L83 166 L87 216 L105 214 Q110 185 106 156 Z" />
      </g>
    </svg>
  `;
}

function renderBackSvg(regionStats) {
  return `
    <svg viewBox="0 0 160 300" class="heatmap-svg" aria-label="후면 근육 히트맵">
      <!-- Head & Neck Silhouette -->
      <circle cx="80" cy="22" r="13" fill="#1c1c1f" stroke="#323238" stroke-width="1.2" />
      <rect x="73" y="34" width="14" height="10" rx="4" fill="#1c1c1f" />
      <!-- Back Forearm / Heel Silhouette -->
      <path d="M27 106 L38 109 L31 144 L21 141 Z" fill="#1c1c1f" />
      <path d="M133 106 L122 109 L129 144 L139 141 Z" fill="#1c1c1f" />
      <ellipse cx="61" cy="285" rx="9" ry="5" fill="#1c1c1f" />
      <ellipse cx="99" cy="285" rx="9" ry="5" fill="#1c1c1f" />

      <!-- Traps, Rhomboids & Rear Delts -->
      <g data-region="traps_rear_delts" ${regionStyle(regionStats, "traps_rear_delts")}>
        <path d="M70 42 L90 42 L108 54 L80 80 L52 54 Z" />
        <path d="M48 48 Q35 50 32 67 L44 72 L52 55 Z" />
        <path d="M112 48 Q125 50 128 67 L116 72 L108 55 Z" />
      </g>

      <!-- Lats & Teres Major -->
      <g data-region="lats" ${regionStyle(regionStats, "lats")}>
        <path d="M51 74 L76 84 L74 118 L55 112 Q47 92 51 74 Z" />
        <path d="M109 74 L84 84 L86 118 L105 112 Q113 92 109 74 Z" />
      </g>

      <!-- Triceps -->
      <g data-region="triceps" ${regionStyle(regionStats, "triceps")}>
        <path d="M32 71 L43 75 L39 105 L28 101 Z" />
        <path d="M128 71 L117 75 L121 105 L132 101 Z" />
      </g>

      <!-- Lower Back (Erector Spinae) -->
      <g data-region="lower_back" ${regionStyle(regionStats, "lower_back")}>
        <path d="M64 118 L96 118 L93 144 L67 144 Z" />
      </g>

      <!-- Glutes -->
      <g data-region="glutes" ${regionStyle(regionStats, "glutes")}>
        <path d="M54 146 L78 146 L77 175 Q58 178 52 164 Z" />
        <path d="M106 146 L82 146 L83 175 Q102 178 108 164 Z" />
      </g>

      <!-- Hamstrings -->
      <g data-region="hamstrings" ${regionStyle(regionStats, "hamstrings")}>
        <path d="M54 178 L76 178 L73 222 L56 220 Z" />
        <path d="M106 178 L84 178 L87 222 L104 220 Z" />
      </g>

      <!-- Calves -->
      <g data-region="calves" ${regionStyle(regionStats, "calves")}>
        <path d="M56 228 L72 228 L68 276 L58 276 Q53 252 56 228 Z" />
        <path d="M104 228 L88 228 L92 276 L102 276 Q107 252 104 228 Z" />
      </g>
    </svg>
  `;
}

export function renderCompletionReportModal(store) {
  const body = document.getElementById("reportModalBody");
  if (!body) return;

  const data = buildTodayReportData(store);
  const maxRegionLoad = data.strengthBreakdown.reduce((m, r) => Math.max(m, r.load), 1);

  body.innerHTML = `
    <!-- Front & Back Muscle Heatmap -->
    <div class="report-heatmap-box">
      <div class="report-heatmap-grid">
        <div class="heatmap-col">
          <div class="heatmap-side-label">FRONT · 전면</div>
          ${renderFrontSvg(data.regionStats)}
        </div>
        <div class="heatmap-col">
          <div class="heatmap-side-label">BACK · 후면</div>
          ${renderBackSvg(data.regionStats)}
        </div>
      </div>

      <!-- Compact Legend -->
      <div class="heatmap-legend">
        <span><i class="legend-dot" style="background:#a3e635; box-shadow:0 0 6px rgba(163,230,53,0.6);"></i>주 자극</span>
        <span><i class="legend-dot" style="background:#4d7c0f;"></i>보조 자극</span>
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
              const barColor = r.level === "primary" ? "#a3e635" : "#4d7c0f";
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
