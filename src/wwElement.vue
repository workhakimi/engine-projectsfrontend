<template>
  <div class="gdm-proj" :style="cssVars" @click.self="closeColorPicker">

    <!-- ═══ Empty state ═══ -->
    <div v-if="displayProjects.length === 0" class="gdm-proj__empty">
      <div class="gdm-proj__empty-icon">📁</div>
      <p class="gdm-proj__empty-title">No projects</p>
      <p class="gdm-proj__empty-sub">Bind your projects collection to see results</p>
    </div>

    <!-- ═══ Project list ═══ -->
    <div v-else class="gdm-proj__list">
      <div
        v-for="proj in displayProjects"
        :key="proj.id"
        class="gdm-proj-card"
        :class="{ 'gdm-proj-card--preview': proj._p }"
        :style="cardStyles"
      >

        <!-- ── Card header ── -->
        <div class="gdm-proj-card__header">
          <div class="gdm-proj-card__pills">
            <span v-if="proj.type" class="gdm-pill gdm-pill--type">{{ proj.type }}</span>
            <span
              v-if="proj.status"
              class="gdm-pill gdm-pill--status"
              :class="'gdm-pill--status-' + normStatus(proj.status)"
            >{{ proj.status }}</span>
            <span class="gdm-proj-card__date">{{ formatDate(proj.created_at) }}</span>
          </div>
          <div class="gdm-proj-card__title-row">
            <h2 class="gdm-proj-card__title">{{ proj.title || 'Untitled Project' }}</h2>
            <div class="gdm-proj-card__actions">
              <a
                v-if="proj.agreementlink"
                :href="proj.agreementlink"
                class="gdm-action-btn gdm-action-btn--link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 16 16" fill="none" class="gdm-icon">
                  <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V9M9 1h6v6M15 1L7 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="gdm-action-btn__label">Agreement</span>
              </a>
              <button
                v-if="isAdmin && !proj._p"
                type="button"
                class="gdm-action-btn"
                :class="{ 'gdm-action-btn--cancel': editingId === proj.id }"
                @click="toggleEdit(proj)"
              >
                <svg v-if="editingId !== proj.id" viewBox="0 0 16 16" fill="none" class="gdm-icon">
                  <path d="M11.013 2.513a1.75 1.75 0 012.475 2.474L5.5 13H2v-3.5l8.013-7.987z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else viewBox="0 0 16 16" fill="none" class="gdm-icon">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span class="gdm-action-btn__label">{{ editingId === proj.id ? 'Cancel' : 'Edit' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ── Gantt chart ── -->
        <div v-if="ganttData[proj.id] && editingId !== proj.id" class="gdm-gantt">
          <div class="gdm-gantt__inner">
              <!-- Row 1: week date labels (clean, no indicators) -->
              <div class="gdm-gantt__head gdm-gantt__head--weeks">
                <div
                  v-for="wk in ganttData[proj.id].visWeeks"
                  :key="wk.ts"
                  class="gdm-gantt__wk-label"
                  :style="{ left: wk.pct + '%' }"
                >{{ wk.label }}</div>
              </div>

              <!-- Row 2: day-letter labels (S M T W T F S) — no Today here -->
              <div class="gdm-gantt__head gdm-gantt__head--days">
                <div
                  v-for="day in ganttData[proj.id].days"
                  :key="'dl' + day.ts"
                  class="gdm-gantt__day-letter"
                  :class="{
                    'gdm-gantt__day-letter--weekend': day.letter === 'S',
                    'gdm-gantt__day-letter--today': Math.abs(day.pct - ganttData[proj.id].todayPct) < (100 / ganttData[proj.id].days.length / 2),
                  }"
                  :style="{ left: day.pct + '%' }"
                >{{ day.letter }}</div>
              </div>

              <!-- Row 3: dedicated indicator strip — Today only -->
              <div class="gdm-gantt__head gdm-gantt__head--indicators">
                <div
                  v-if="ganttData[proj.id].todayPct >= 0 && ganttData[proj.id].todayPct <= 100"
                  class="gdm-gantt__today-tag"
                  :style="{ left: ganttData[proj.id].todayPct + '%' }"
                >Today</div>
              </div>

              <!-- Chart body: grid + bars + today line + milestones (labels at bottom) -->
              <div
                class="gdm-gantt__body"
                :style="{ height: ganttData[proj.id].bars.length * ROW_H + 10 + 'px' }"
              >
                <!-- Day lines -->
                <div
                  v-for="day in ganttData[proj.id].days"
                  :key="'dl' + day.ts"
                  class="gdm-gantt__dayline"
                  :style="{ left: day.pct + '%' }"
                />
                <!-- Week grid lines -->
                <div
                  v-for="wk in ganttData[proj.id].visWeeks"
                  :key="'gl' + wk.ts"
                  class="gdm-gantt__gridline"
                  :style="{ left: wk.pct + '%' }"
                />
                <!-- Today line -->
                <div
                  v-if="ganttData[proj.id].todayPct >= 0 && ganttData[proj.id].todayPct <= 100"
                  class="gdm-gantt__today-line"
                  :style="{ left: ganttData[proj.id].todayPct + '%' }"
                />
                <!-- Bars — tooltip rendered via fixed overlay outside scroll -->
                <div
                  v-for="(bar, bi) in ganttData[proj.id].bars"
                  :key="bi"
                  class="gdm-gantt__bar-wrap"
                  :style="{
                    left: bar.left + '%',
                    width: bar.width + '%',
                    top: (bi * ROW_H + 4) + 'px',
                  }"
                  @mouseenter="showTip(bar, $event)"
                  @mousemove="moveTip($event)"
                  @mouseleave="hideTip"
                >
                  <div class="gdm-gantt__bar" :style="{ background: bar.color || '#94a3b8' }">
                    <span class="gdm-gantt__bar-label">{{ bar.label }}</span>
                  </div>
                </div>

                <!-- Milestone markers: line full height, label BELOW body -->
                <div
                  v-for="(ms, mi) in ganttData[proj.id].milestones"
                  :key="'ms' + mi"
                  class="gdm-gantt__milestone"
                  :style="{ left: ms.pct + '%' }"
                >
                  <div class="gdm-gantt__ms-line" :style="{ borderLeftColor: ms.color || '#64748b' }" />
                  <div class="gdm-gantt__ms-label" :style="{ color: ms.color || '#64748b', borderColor: ms.color || '#64748b' }">
                    {{ ms.label }}
                  </div>
                </div>
              </div>
          </div>
        </div>

        <!-- Empty structure notice -->
        <div
          v-else-if="!ganttData[proj.id] && editingId !== proj.id && getRows(proj).length === 0 && isAdmin"
          class="gdm-gantt__empty"
        >
          No milestones yet — click <strong>Edit</strong> to add the project structure.
        </div>

        <!-- ── Edit panel ── -->
        <div v-if="editingId === proj.id" class="gdm-edit">
          <p class="gdm-edit__hint">Define project milestones. Each row becomes a bar on the Gantt chart.</p>

          <div class="gdm-edit__rows">
            <transition-group name="gdm-row">
              <div v-for="(row, ri) in editRows" :key="ri" class="gdm-edit__row">
                <span class="gdm-edit__row-idx">{{ ri + 1 }}</span>

                <!-- Color swatch + picker -->
                <div class="gdm-edit__color-cell" @click.stop>
                  <button
                    type="button"
                    class="gdm-edit__color-dot"
                    :style="{ background: row.color || '#94a3b8' }"
                    :title="row.color"
                    @click.stop="colorPickerIdx = colorPickerIdx === ri ? -1 : ri"
                  />
                  <div v-if="colorPickerIdx === ri" class="gdm-edit__palette">
                    <button
                      v-for="c in COLOR_PALETTE"
                      :key="c"
                      type="button"
                      class="gdm-edit__palette-dot"
                      :class="{ 'gdm-edit__palette-dot--sel': row.color === c }"
                      :style="{ background: c }"
                      @click.stop="pickColor(ri, c)"
                    />
                  </div>
                </div>

                <!-- Label -->
                <input
                  v-model="editRows[ri].label"
                  type="text"
                  class="gdm-edit__input gdm-edit__input--label"
                  placeholder="Milestone description…"
                />

                <!-- Dates -->
                <input
                  v-model="editRows[ri].start_date"
                  type="date"
                  class="gdm-edit__input gdm-edit__input--date"
                />
                <span class="gdm-edit__arrow">→</span>
                <input
                  v-model="editRows[ri].end_date"
                  type="date"
                  class="gdm-edit__input gdm-edit__input--date"
                />

                <!-- Delete -->
                <button
                  type="button"
                  class="gdm-edit__del"
                  title="Remove milestone"
                  @click="deleteRow(ri)"
                >
                  <svg viewBox="0 0 16 16" fill="none" class="gdm-icon">
                    <path d="M3 4h10M6 4V2h4v2M5 4l.5 9h5l.5-9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </transition-group>
          </div>

          <div class="gdm-edit__footer">
            <button type="button" class="gdm-edit__add-btn" @click="addRow">
              <svg viewBox="0 0 16 16" fill="none" class="gdm-icon"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              Add milestone
            </button>
            <div class="gdm-edit__foot-actions">
              <button type="button" class="gdm-btn gdm-btn--ghost" @click="cancelEdit">Cancel</button>
              <button type="button" class="gdm-btn gdm-btn--primary" @click="saveEdit(proj)">
                <svg viewBox="0 0 16 16" fill="none" class="gdm-icon"><path d="M2 9l4 4 8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Save changes
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>

  <!-- ═══ Fixed bar tooltip (outside scroll/overflow context) ═══ -->
  <div
    v-if="tipBar"
    class="gdm-gantt__tip-fixed"
    :style="{ top: tipY + 'px', left: tipX + 'px' }"
  >
    <p class="gdm-gantt__tip-label">{{ tipBar.label }}</p>
    <div class="gdm-gantt__tip-dates">
      <span class="gdm-gantt__tip-date">
        <svg viewBox="0 0 12 12" fill="none" class="gdm-gantt__tip-icon">
          <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" stroke-width="1.1"/>
          <path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
        </svg>
        {{ fmtShort(tipBar.start_date) }}
      </span>
      <span class="gdm-gantt__tip-arrow">→</span>
      <span class="gdm-gantt__tip-date">{{ fmtShort(tipBar.end_date) }}</span>
    </div>
  </div>

</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const ROW_H = 28; // px per gantt row slot

const COLOR_PALETTE = [
  '#9FB6CC', '#7BA3C0', '#4A90C4', '#2563EB',
  '#F2A36E', '#E8854F', '#D4652E', '#B45309',
  '#5E7F5B', '#4F6F4F', '#3A6B38', '#166534',
  '#A78BFA', '#7C3AED', '#6D28D9', '#4C1D95',
  '#F472B6', '#EC4899', '#DB2777', '#9D174D',
  '#FBBF24', '#F59E0B', '#D97706', '#92400E',
  '#34D399', '#10B981', '#059669', '#065F46',
  '#94A3B8', '#64748B', '#475569', '#334155',
];

/* ─── Preview data matching the user's exact shape ─── */
const PREVIEW = [
  {
    id: 'prev-1',
    _p: true,
    title: 'Digital Transformation Project',
    type: 'Project Agreement',
    status: 'In Progress',
    created_at: new Date().toISOString(),
    agreementlink: '#',
    structure: {
      rows: [
        { color: '#9FB6CC', label: 'Consultancy period: UI/UX workflow alignment, DB architecture', start_date: '2026-02-16', end_date: '2026-02-23' },
        { color: '#F2A36E', label: 'Order planning & management · Document management tool', start_date: '2026-02-23', end_date: '2026-03-09' },
        { color: '#F2A36E', label: 'Mockup request system', start_date: '2026-02-23', end_date: '2026-03-09' },
        { color: '#5E7F5B', label: 'Production job sheet tool', start_date: '2026-03-02', end_date: '2026-03-16' },
        { color: '#5E7F5B', label: 'Booking sheet tools', start_date: '2026-03-09', end_date: '2026-04-06' },
        { color: '#5E7F5B', label: 'Inventory & calendar tools', start_date: '2026-03-16', end_date: '2026-04-13' },
        { color: '#5E7F5B', label: 'Client portal — billing, CMS, comms', start_date: '2026-03-23', end_date: '2026-04-20' },
        { color: '#4F6F4F', label: 'Training, final updates', start_date: '2026-04-27', end_date: '2026-05-11' },
      ],
      milestones: [
        { date: '2026-03-30', color: '#1F6FEB', label: 'Midpoint' },
        { date: '2026-05-11', color: '#A142F4', label: 'Month 3 end' },
      ],
    },
  },
];

/* ─── Gantt helpers ─── */
const mondayOf = (d) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  const day = dt.getDay();
  dt.setDate(dt.getDate() - (day === 0 ? 6 : day - 1));
  return dt;
};

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // Sunday=0

const computeGantt = (rows, milestones = []) => {
  const valid = rows.filter(r => r.start_date && r.end_date);
  if (!valid.length) return null;

  const allMs = valid.flatMap(r => [
    new Date(r.start_date).getTime(),
    new Date(r.end_date).getTime(),
  ]).filter(n => !isNaN(n));
  if (!allMs.length) return null;

  const minDate = mondayOf(new Date(Math.min(...allMs)));
  // End: next Monday after max date, plus 1 week buffer
  const maxDate = mondayOf(new Date(Math.max(...allMs) + 14 * 86400000));
  maxDate.setDate(maxDate.getDate() + 7);

  const totalMs = maxDate.getTime() - minDate.getTime();
  if (totalMs <= 0) return null;

  // Generate weekly ticks
  const weeks = [];
  let cur = new Date(minDate);
  while (cur.getTime() < maxDate.getTime()) {
    weeks.push({
      ts: cur.getTime(),
      pct: ((cur.getTime() - minDate.getTime()) / totalMs) * 100,
      label: cur.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    });
    cur = new Date(cur.getTime() + 7 * 86400000);
  }

  // Visible week labels — show every Nth so they don't crowd
  const visWeeks = [];
  let lastPct = -Infinity;
  for (const wk of weeks) {
    if (wk.pct - lastPct >= 7) {
      visWeeks.push(wk);
      lastPct = wk.pct;
    }
  }

  const todayPct = ((Date.now() - minDate.getTime()) / totalMs) * 100;

  // Daily ticks — for grid lines and day-letter header
  const days = [];
  let dayCur = new Date(minDate);
  while (dayCur.getTime() < maxDate.getTime()) {
    const pct = ((dayCur.getTime() - minDate.getTime()) / totalMs) * 100;
    days.push({
      ts: dayCur.getTime(),
      pct,
      letter: DAY_LETTERS[dayCur.getDay()],
      isWeekStart: dayCur.getDay() === 1, // Monday
    });
    dayCur = new Date(dayCur.getTime() + 86400000);
  }

  const bars = rows.map(r => {
    if (!r.start_date || !r.end_date) return { ...r, left: 0, width: 0 };
    const s = new Date(r.start_date).getTime();
    const e = new Date(r.end_date).getTime();
    const left = ((s - minDate.getTime()) / totalMs) * 100;
    const width = ((e - s) / totalMs) * 100;
    return { ...r, left: Math.max(0, left), width: Math.max(1, width) };
  });

  // Milestone positions
  const milestoneMarkers = (milestones || [])
    .filter(m => m.date)
    .map(m => {
      const ms = new Date(m.date).getTime();
      const pct = ((ms - minDate.getTime()) / totalMs) * 100;
      return { ...m, pct };
    })
    .filter(m => m.pct >= 0 && m.pct <= 100);

  return {
    weeks,
    visWeeks,
    days,
    bars,
    todayPct,
    milestones: milestoneMarkers,
  };
};

/* ─── Date input helpers ─── */
const toDateInput = (d) => {
  if (!d) return '';
  const s = String(d);
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  } catch { return ''; }
};

export default {
  name: 'GdmProjectsFrontend',
  props: {
    content: { type: Object, required: true },
    uid: { type: String, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
  },
  emits: ['trigger-event'],
  setup(props, { emit }) {

    /* ─── Raw data ─── */
    const rawProjects = computed(() => {
      const data = props.content?.projectsData;
      if (!data) return [];
      const arr = typeof wwLib !== 'undefined' && wwLib?.wwUtils?.getDataFromCollection
        ? wwLib.wwUtils.getDataFromCollection(data)
        : data;
      return Array.isArray(arr) ? arr : [];
    });

    const displayProjects = computed(() => {
      const items = rawProjects.value;
      /* wwEditor:start */
      if (props.wwEditorState?.isEditing && items.length === 0) return PREVIEW;
      /* wwEditor:end */
      return items;
    });

    const getRows = (proj) => {
      const rows = proj?.structure?.rows;
      return Array.isArray(rows) ? rows.filter(r => r && (r.label || r.start_date || r.end_date)) : [];
    };

    const getMilestones = (proj) => {
      const ms = proj?.structure?.milestones;
      return Array.isArray(ms) ? ms.filter(m => m && m.date) : [];
    };

    /* ─── Gantt data map ─── */
    const ganttData = computed(() => {
      const map = {};
      for (const proj of displayProjects.value) {
        const rows = getRows(proj);
        if (rows.length > 0) {
          const g = computeGantt(rows, getMilestones(proj));
          if (g) map[proj.id] = g;
        }
      }
      return map;
    });

    /* ─── View mode ─── */
    const isAdmin = computed(() => props.content?.viewMode !== 'client');

    /* ─── Edition-mode guard (same pattern as gdm-tabs) ─── */
    const isEditionMode = () => {
      /* wwEditor:start */
      return props.wwEditorState?.editMode === wwLib?.wwEditorHelper?.EDIT_MODES?.EDITION;
      /* wwEditor:end */
      return false; // eslint-disable-line no-unreachable
    };

    /* ─── Edit state ─── */
    const editingId = ref(null);
    const editRows = ref([]);
    const colorPickerIdx = ref(-1);

    const closeColorPicker = () => { colorPickerIdx.value = -1; };

    const toggleEdit = (proj) => {
      /* wwEditor:start */
      if (isEditionMode()) return;
      /* wwEditor:end */
      if (editingId.value === proj.id) {
        cancelEdit();
        return;
      }
      const rows = getRows(proj);
      editRows.value = rows.map(r => ({
        color: r.color || '#94a3b8',
        label: r.label || '',
        start_date: toDateInput(r.start_date),
        end_date: toDateInput(r.end_date),
      }));
      editingId.value = proj.id;
      colorPickerIdx.value = -1;
    };

    const cancelEdit = () => {
      editingId.value = null;
      editRows.value = [];
      colorPickerIdx.value = -1;
    };

    const saveEdit = (proj) => {
      /* wwEditor:start */
      if (isEditionMode()) return;
      /* wwEditor:end */
      emit('trigger-event', {
        name: 'onSaveStructure',
        event: {
          value: {
            id: proj.id,
            structure: { rows: editRows.value.map(r => ({ ...r })) },
          },
        },
      });
      cancelEdit();
    };

    const addRow = () => {
      editRows.value.push({ color: '#94a3b8', label: '', start_date: '', end_date: '' });
    };

    const deleteRow = (idx) => { editRows.value.splice(idx, 1); };

    const pickColor = (idx, color) => {
      editRows.value[idx].color = color;
      colorPickerIdx.value = -1;
    };

    /* ─── Tooltip (fixed, outside scroll context) ─── */
    const tipBar = ref(null);
    const tipX   = ref(0);
    const tipY   = ref(0);

    const showTip = (bar, e) => {
      tipBar.value = bar;
      tipX.value = e.clientX + 14;
      tipY.value = e.clientY - 64;
    };
    const moveTip = (e) => {
      tipX.value = e.clientX + 14;
      tipY.value = e.clientY - 64;
    };
    const hideTip = () => { tipBar.value = null; };

    /* ─── Global click to close palette ─── */
    onMounted(() => document.addEventListener('click', closeColorPicker));
    onUnmounted(() => document.removeEventListener('click', closeColorPicker));

    /* ─── Formatters ─── */
    const normStatus = (s) => String(s || '').toLowerCase().replace(/[\s_]+/g, '-');

    const formatDate = (d) => {
      if (!d) return '';
      try {
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      } catch { return ''; }
    };

    const fmtShort = (d) => {
      if (!d) return '—';
      try {
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } catch { return String(d); }
    };

    /* ─── Styles ─── */
    const cssVars = computed(() => ({
      fontFamily: props.content?.fontFamily || 'DM Sans, system-ui, sans-serif',
      fontSize: props.content?.fontSize || '15px',
      '--gdm-accent': props.content?.accentColor || '#0d9488',
      '--gdm-title': props.content?.titleColor || '#1e293b',
      '--gdm-text': props.content?.textColor || '#475569',
      minHeight: '120px',
    }));

    const cardStyles = computed(() => ({
      backgroundColor: props.content?.cardBackgroundColor || '#ffffff',
      borderRadius: props.content?.cardBorderRadius || '14px',
      padding: props.content?.cardPadding || '1.5rem',
    }));

    return {
      props,
      isAdmin,
      displayProjects,
      ganttData,
      getRows,
      editingId,
      editRows,
      colorPickerIdx,
      toggleEdit,
      cancelEdit,
      saveEdit,
      addRow,
      deleteRow,
      closeColorPicker,
      pickColor,
      normStatus,
      formatDate,
      fmtShort,
      cssVars,
      cardStyles,
      COLOR_PALETTE,
      ROW_H,
      tipBar, tipX, tipY, showTip, moveTip, hideTip,
    };
  },
};
</script>

<style lang="scss" scoped>
.gdm-proj {
  width: 100%;
  box-sizing: border-box;
  color: var(--gdm-text);
}

/* ─── Shared icon ─── */
.gdm-icon { width: 14px; height: 14px; flex-shrink: 0; }

/* ─── Empty state ─── */
.gdm-proj__empty {
  padding: 3rem 1rem;
  text-align: center;
  background: #f8fafc;
  border-radius: 12px;
  border: 1.5px dashed #e2e8f0;
}
.gdm-proj__empty-icon { font-size: 2.25rem; margin-bottom: 0.625rem; }
.gdm-proj__empty-title { margin: 0 0 0.25rem; font-weight: 700; color: #475569; font-size: 1rem; }
.gdm-proj__empty-sub { margin: 0; font-size: 0.8125rem; color: #94a3b8; }

/* ─── Project list ─── */
.gdm-proj__list { display: flex; flex-direction: column; gap: 1.25rem; }

/* ─── Card ─── */
.gdm-proj-card {
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: visible;
  transition: box-shadow 0.2s;

  &:hover { box-shadow: 0 6px 24px rgba(0, 0, 0, 0.09); }
  &--preview { opacity: 0.85; }
}

/* Card header */
.gdm-proj-card__header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.125rem;
}

.gdm-proj-card__pills {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

/* Badges */
.gdm-pill {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  white-space: nowrap;

  &--type {
    background: color-mix(in srgb, var(--gdm-accent) 12%, transparent);
    color: var(--gdm-accent);
  }

  &--status {
    color: #fff;
    background: #94a3b8;
    &-in-progress  { background: #0d9488; }
    &-active       { background: #0d9488; }
    &-completed    { background: #10b981; }
    &-done         { background: #10b981; }
    &-pending      { background: #f59e0b; }
    &-on-hold      { background: #94a3b8; }
    &-cancelled    { background: #ef4444; }
  }
}

.gdm-proj-card__date {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-left: auto;
  white-space: nowrap;
}

.gdm-proj-card__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.gdm-proj-card__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--gdm-title);
  line-height: 1.2;
  flex: 1;
  min-width: 0;
}

.gdm-proj-card__actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
}

/* Action buttons (Agreement / Edit) */
.gdm-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #64748b;
  background: none;
  border: 1.5px solid #e2e8f0;
  padding: 0.35rem 0.625rem;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  pointer-events: all;

  &:hover {
    background: #f8fafc;
    color: #334155;
    border-color: #cbd5e1;
  }

  &--link {
    color: var(--gdm-accent);
    border-color: color-mix(in srgb, var(--gdm-accent) 30%, transparent);
    &:hover {
      background: color-mix(in srgb, var(--gdm-accent) 8%, transparent);
      border-color: var(--gdm-accent);
      color: var(--gdm-accent);
    }
  }

  &--cancel {
    color: #ef4444;
    border-color: #fecaca;
    background: #fef2f2;
    &:hover { background: #fee2e2; border-color: #fca5a5; }
  }
}

/* ═══════════════════════════════════════════════
   GANTT CHART
═══════════════════════════════════════════════ */
.gdm-gantt {
  border-top: 1px solid #f1f5f9;
  padding-top: 0.875rem;
  margin-top: 0.25rem;
}

.gdm-gantt__inner {
  position: relative;
  width: 100%;
  overflow: visible;
}

/* Header rows */
.gdm-gantt__head {
  position: relative;
  overflow: visible;

  &--weeks {
    height: 18px;
    margin-bottom: 1px;
  }

  &--days {
    height: 14px;
    margin-bottom: 1px;
  }

  /* Dedicated indicator strip — just Today pill */
  &--indicators {
    height: 16px;
    margin-bottom: 3px;
  }
}

.gdm-gantt__wk-label {
  position: absolute;
  top: 2px;
  transform: translateX(3px);
  font-size: 0.6rem;
  font-weight: 600;
  color: #94a3b8;
  white-space: nowrap;
  user-select: none;
  letter-spacing: 0.03em;
}

/* Day letter (S M T W T F S) */
.gdm-gantt__day-letter {
  position: absolute;
  top: 1px;
  transform: translateX(-50%);
  font-size: 0.5rem;
  font-weight: 600;
  color: #c8d3de;
  user-select: none;
  line-height: 1;
  letter-spacing: 0;

  &--weekend { color: #dde3ea; }
  &--today { color: var(--gdm-accent); font-weight: 700; }
}

/* Today pill — lives in its own indicator row, never overlaps labels */
.gdm-gantt__today-tag {
  position: absolute;
  top: 1px;
  transform: translateX(-50%);
  font-size: 0.5rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--gdm-accent);
  background: color-mix(in srgb, var(--gdm-accent) 10%, #fff 90%);
  border: 1px solid color-mix(in srgb, var(--gdm-accent) 30%, transparent);
  padding: 1px 5px;
  border-radius: 3px;
  z-index: 20;
  white-space: nowrap;
  line-height: 1.8;
  pointer-events: none;
}

/* Chart body — overflow visible so tooltips can poke above bars */
.gdm-gantt__body {
  position: relative;
  background: #f8fafc;
  border-radius: 8px;
  overflow: visible;
  /* Clip just the background, not children, using a box-shadow trick */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 8px;
    background: #f8fafc;
    z-index: 0;
  }
}

.gdm-gantt__dayline {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #eef1f5;
  z-index: 1;
  pointer-events: none;
}

.gdm-gantt__gridline {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #d8e0ea;
  z-index: 2;
  pointer-events: none;
}

.gdm-gantt__today-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--gdm-accent);
  opacity: 0.65;
  z-index: 3;
}

/* Bar wrapper */
.gdm-gantt__bar-wrap {
  position: absolute;
  height: 22px;
  z-index: 2;
  cursor: default;

  &:hover .gdm-gantt__bar { opacity: 1; filter: brightness(1.06); }
}

/* Visual bar */
.gdm-gantt__bar {
  width: 100%;
  height: 100%;
  border-radius: 5px;
  display: flex;
  align-items: center;
  overflow: hidden;
  opacity: 0.88;
  transition: opacity 0.15s, filter 0.15s;
}

.gdm-gantt__bar-label {
  font-size: 0.6rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 0.5rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  pointer-events: none;
  letter-spacing: 0.01em;
}

/* Fixed tooltip — rendered at component root, never clipped by scroll */
.gdm-gantt__tip-fixed {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  min-width: 180px;
  max-width: 280px;
  background: #1e293b;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22), 0 2px 6px rgba(0, 0, 0, 0.1);
  white-space: normal;
}

.gdm-gantt__tip-label {
  margin: 0 0 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #f1f5f9;
  line-height: 1.4;
  word-break: break-word;
}

.gdm-gantt__tip-dates {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.gdm-gantt__tip-date {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: #94a3b8;
}

.gdm-gantt__tip-icon { width: 11px; height: 11px; flex-shrink: 0; color: #64748b; }
.gdm-gantt__tip-arrow { font-size: 0.6875rem; color: #475569; }

/* ─── Milestone markers ─── */
.gdm-gantt__milestone {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 5;
  pointer-events: none;
  overflow: visible;
}

.gdm-gantt__ms-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 0;
  border-left: 2px dashed;
  opacity: 0.8;
}

/* Label sits BELOW the body — positive top offset from bottom of milestone element */
.gdm-gantt__ms-label {
  position: absolute;
  top: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  background: #fff;
  border: 1px solid;
  border-radius: 3px;
  padding: 1px 5px;
  line-height: 1.6;
  pointer-events: none;
}

.gdm-gantt__empty {
  margin-top: 0.75rem;
  font-size: 0.8125rem;
  color: #94a3b8;
  font-style: italic;
  padding: 0.75rem 0;
  border-top: 1px dashed #e2e8f0;
}

/* ═══════════════════════════════════════════════
   EDIT PANEL
═══════════════════════════════════════════════ */
.gdm-edit {
  border-top: 1px solid #e2e8f0;
  padding-top: 1.125rem;
  margin-top: 0.875rem;
}

.gdm-edit__hint {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin: 0 0 1rem;
  line-height: 1.5;
}

.gdm-edit__rows {
  display: flex;
  flex-direction: column;
  gap: 0.4375rem;
  margin-bottom: 1rem;
}

.gdm-edit__row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e8edf2;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  flex-wrap: wrap;
  transition: border-color 0.15s;

  &:focus-within { border-color: color-mix(in srgb, var(--gdm-accent) 40%, transparent); }
}

.gdm-edit__row-idx {
  font-size: 0.625rem;
  font-weight: 700;
  color: #cbd5e1;
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}

/* Color picker cell */
.gdm-edit__color-cell {
  position: relative;
  flex-shrink: 0;
}

.gdm-edit__color-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.12);
  cursor: pointer;
  pointer-events: all;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: scale(1.15);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  }
}

.gdm-edit__palette {
  position: absolute;
  top: 30px;
  left: 0;
  z-index: 200;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.5rem 0.5rem 0.4rem;
  display: grid;
  grid-template-columns: repeat(8, 22px);
  gap: 5px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06);
}

.gdm-edit__palette-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2.5px solid transparent;
  cursor: pointer;
  pointer-events: all;
  transition: transform 0.12s, border-color 0.12s;

  &:hover { transform: scale(1.18); }
  &--sel { border-color: #1e293b; }
}

/* Inputs */
.gdm-edit__input {
  padding: 0.375rem 0.5rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-family: inherit;
  background: #fff;
  color: #1e293b;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:focus {
    border-color: var(--gdm-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--gdm-accent) 15%, transparent);
  }

  &--label {
    flex: 1;
    min-width: 100px;
  }

  &--date {
    width: 130px;
    flex-shrink: 0;
  }
}

.gdm-edit__arrow {
  font-size: 0.75rem;
  color: #cbd5e1;
  flex-shrink: 0;
}

.gdm-edit__del {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 6px;
  color: #94a3b8;
  flex-shrink: 0;
  pointer-events: all;
  transition: color 0.15s, background 0.15s;

  &:hover { color: #ef4444; background: #fef2f2; }
}

/* Edit footer */
.gdm-edit__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.gdm-edit__add-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--gdm-accent);
  background: none;
  border: 1.5px dashed color-mix(in srgb, var(--gdm-accent) 40%, transparent);
  border-radius: 7px;
  padding: 0.4rem 0.875rem;
  cursor: pointer;
  pointer-events: all;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: color-mix(in srgb, var(--gdm-accent) 8%, transparent);
    border-color: var(--gdm-accent);
  }
}

.gdm-edit__foot-actions {
  display: flex;
  gap: 0.5rem;
}

/* Shared buttons */
.gdm-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 1rem;
  border-radius: 7px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  pointer-events: all;
  transition: opacity 0.15s, transform 0.1s;

  &:hover:not(:disabled) { opacity: 0.88; }
  &:active:not(:disabled) { transform: scale(0.97); }

  &--primary { background: var(--gdm-accent); color: #fff; }
  &--ghost { background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0; }
}

/* Row enter/leave animation */
.gdm-row-enter-active,
.gdm-row-leave-active { transition: all 0.2s ease; }
.gdm-row-enter-from,
.gdm-row-leave-to { opacity: 0; transform: translateY(-6px); }

/* ─── Responsive ─── */
@media (max-width: 600px) {
  .gdm-proj-card__date { display: none; }
  .gdm-proj-card__title { font-size: 1rem; }
  .gdm-edit__input--date { width: 118px; font-size: 0.75rem; }
}

@media (max-width: 480px) {
  .gdm-action-btn__label { display: none; }
  .gdm-edit__input--label { min-width: 80px; }
  .gdm-edit__row { padding: 0.5rem; gap: 0.375rem; }
}
</style>
