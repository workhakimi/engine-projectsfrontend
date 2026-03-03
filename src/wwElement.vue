<template>
  <div class="gdm-projects" :style="cssVars">

    <!-- Mode badge (admin only) -->
    <div v-if="isAdmin" class="gdm-projects__mode-badge">Admin view</div>

    <div
      class="gdm-projects__grid"
      :class="{ 'gdm-projects__grid--grid': props.content?.layoutMode === 'grid' }"
    >
      <div
        v-for="proj in displayProjects"
        :key="getF('id', proj)"
        class="gdm-projects__card"
        :style="cardStyles"
        :class="{ 'gdm-projects__card--preview': proj._p }"
        @click="handleClick(proj)"
      >
        <!-- Top: title + status badge -->
        <div class="gdm-projects__card-header">
          <h3 class="gdm-projects__card-title">{{ getF('title', proj) || 'Untitled Project' }}</h3>
          <span
            v-if="getF('status', proj)"
            class="gdm-projects__badge"
            :style="getBadgeStyle(getF('status', proj))"
          >
            {{ getF('status', proj) }}
          </span>
        </div>

        <!-- Client name (admin sees it always; client only if relevant) -->
        <div v-if="getClientName(proj)" class="gdm-projects__card-client">
          {{ getClientName(proj) }}
        </div>

        <!-- Type pill -->
        <div v-if="getF('type', proj)" class="gdm-projects__card-type">
          {{ getF('type', proj) }}
        </div>

        <!-- Date range -->
        <div class="gdm-projects__card-dates">
          <span class="gdm-projects__date-label">Timeline</span>
          <span v-if="getF('start', proj) || getF('end', proj)" class="gdm-projects__date-range">
            {{ formatDate(getF('start', proj)) || '—' }} → {{ formatDate(getF('end', proj)) || 'ongoing' }}
          </span>
          <span v-else class="gdm-projects__date-none">Not set</span>
        </div>

        <!-- Progress bar (visual, based on elapsed time) -->
        <div v-if="getF('start', proj) && getF('end', proj)" class="gdm-projects__progress-track">
          <div class="gdm-projects__progress-fill" :style="progressStyle(getF('start', proj), getF('end', proj), getF('status', proj))"></div>
        </div>

        <!-- Footer: agreement link + admin delete -->
        <div class="gdm-projects__card-footer">
          <a
            v-if="getF('agreement', proj)"
            :href="getF('agreement', proj)"
            class="gdm-projects__link"
            target="_blank"
            rel="noopener noreferrer"
            @click.stop
          >
            View agreement ↗
          </a>
          <span v-else class="gdm-projects__no-link"></span>
          <button
            v-if="isAdmin"
            type="button"
            class="gdm-projects__delete-btn"
            @click.stop="handleDelete(proj)"
            title="Delete project"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="displayProjects.length === 0" class="gdm-projects__empty">
      <div class="gdm-projects__empty-icon">📁</div>
      <p class="gdm-projects__empty-text">No projects</p>
      <p class="gdm-projects__empty-sub">Bind your Supabase projects collection to see results</p>
    </div>

  </div>
</template>

<script>
import { computed } from 'vue';

const NOW = Date.now();
const mkDate = (daysAgo) => new Date(NOW - 86400000 * daysAgo).toISOString().split('T')[0];
const PREVIEW = [
  { id: 'p1', _p: true, title: 'Brand Identity Refresh', type: 'Design', status: 'active', start_date: mkDate(45), end_date: mkDate(-30), client_id: 'c1', agreementlink: '#' },
  { id: 'p2', _p: true, title: 'E-Commerce Platform Launch', type: 'Development', status: 'pending', start_date: mkDate(10), end_date: mkDate(-60), client_id: 'c2', agreementlink: '' },
  { id: 'p3', _p: true, title: 'Annual Report Design', type: 'Print', status: 'completed', start_date: mkDate(90), end_date: mkDate(15), client_id: 'c1', agreementlink: '#' },
];

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

    /* ─── Resolver ─── */
    const resolve = (formulaKey, item, fallbackKey) => {
      if (typeof wwLib !== 'undefined' && wwLib?.wwFormula?.useFormula) {
        const fn = wwLib.wwFormula.useFormula().resolveMappingFormula;
        const v = fn(props.content?.[formulaKey], item);
        if (v !== undefined && v !== null) return v;
      }
      return item[fallbackKey] ?? '';
    };

    /* ─── Raw data ─── */
    const rawProjects = computed(() => {
      const data = props.content?.projectsData;
      if (!data) return [];
      const arr = typeof wwLib !== 'undefined' && wwLib?.wwUtils?.getDataFromCollection
        ? wwLib.wwUtils.getDataFromCollection(data)
        : data;
      return Array.isArray(arr) ? arr : [];
    });

    const clientsMap = computed(() => {
      const data = props.content?.clientsData;
      if (!data) return {};
      const arr = typeof wwLib !== 'undefined' && wwLib?.wwUtils?.getDataFromCollection
        ? wwLib.wwUtils.getDataFromCollection(data)
        : data;
      if (!Array.isArray(arr)) return {};
      const map = {};
      arr.forEach(c => { if (c.id) map[c.id] = c.company_name ?? c.contact_name ?? ''; });
      return map;
    });

    /* ─── Display with preview fallback ─── */
    const displayProjects = computed(() => {
      const items = rawProjects.value;
      /* wwEditor:start */
      if (props.wwEditorState?.isEditing && items.length === 0) return PREVIEW;
      /* wwEditor:end */
      return items;
    });

    /* ─── Field map ─── */
    const fieldMap = {
      id: ['idFormula', 'id'],
      title: ['titleFormula', 'title'],
      type: ['typeFormula', 'type'],
      status: ['statusFormula', 'status'],
      start: ['startDateFormula', 'start_date'],
      end: ['endDateFormula', 'end_date'],
      agreement: ['agreementLinkFormula', 'agreementlink'],
      clientId: ['clientIdFormula', 'client_id'],
    };
    const getF = (field, item) => {
      const [fk, fb] = fieldMap[field] || [null, field];
      return fk ? resolve(fk, item, fb) : (item[fb] ?? '');
    };
    const getClientName = (item) => {
      const id = getF('clientId', item);
      return id ? clientsMap.value[id] || '' : '';
    };

    /* ─── View mode ─── */
    const isAdmin = computed(() => props.content?.viewMode !== 'client');

    /* ─── Status helpers ─── */
    const normStatus = (s) => String(s || '').toLowerCase().trim();
    const getBadgeStyle = (status) => {
      const s = normStatus(status);
      let bg = props.content?.statusPendingColor || '#f59e0b';
      if (s === 'active' || s === 'in_progress' || s === 'in progress') bg = props.content?.statusActiveColor || '#0d9488';
      else if (s === 'completed' || s === 'done') bg = props.content?.statusCompletedColor || '#10b981';
      return { backgroundColor: bg };
    };

    /* ─── Progress bar ─── */
    const progressStyle = (start, end, status) => {
      const s = normStatus(status);
      if (s === 'completed' || s === 'done') return { width: '100%', background: props.content?.statusCompletedColor || '#10b981' };
      if (!start || !end) return { width: '0%' };
      const startMs = new Date(start).getTime();
      const endMs   = new Date(end).getTime();
      const pct = Math.min(100, Math.max(0, ((NOW - startMs) / (endMs - startMs)) * 100));
      return { width: pct + '%', background: props.content?.statusActiveColor || '#0d9488' };
    };

    /* ─── Formatters ─── */
    const formatDate = (d) => {
      if (!d) return '';
      try {
        const date = new Date(d);
        return isNaN(date.getTime()) ? String(d) : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      } catch { return String(d); }
    };

    /* ─── Events ─── */
    const handleClick = (proj) => {
      /* wwEditor:start */
      if (props.wwEditorState?.isEditing) return;
      /* wwEditor:end */
      if (proj._p) return;
      emit('trigger-event', { name: 'onProjectClick', event: { value: { project: proj } } });
    };
    const handleDelete = (proj) => {
      /* wwEditor:start */
      if (props.wwEditorState?.isEditing) return;
      /* wwEditor:end */
      if (proj._p) return;
      emit('trigger-event', { name: 'onDeleteProject', event: { value: { id: proj.id, title: proj.title } } });
    };

    /* ─── Styles ─── */
    const cssVars = computed(() => ({
      fontFamily: props.content?.fontFamily || 'DM Sans, system-ui, sans-serif',
      fontSize: props.content?.fontSize || '15px',
      '--gdm-title': props.content?.titleColor || '#1e293b',
      '--gdm-accent': props.content?.accentColor || '#0d9488',
      minHeight: '120px',
    }));
    const cardStyles = computed(() => ({
      backgroundColor: props.content?.cardBackgroundColor || '#ffffff',
      borderRadius: props.content?.cardBorderRadius || '12px',
      padding: props.content?.cardPadding || '20px',
    }));

    return {
      props,
      isAdmin,
      displayProjects,
      cssVars,
      cardStyles,
      getF,
      getClientName,
      getBadgeStyle,
      progressStyle,
      formatDate,
      handleClick,
      handleDelete,
    };
  },
};
</script>

<style lang="scss" scoped>
.gdm-projects {
  width: 100%;
  box-sizing: border-box;
}

.gdm-projects__mode-badge {
  display: inline-block;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gdm-accent);
  background: color-mix(in srgb, var(--gdm-accent) 12%, transparent);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.gdm-projects__grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  &--grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

.gdm-projects__card {
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: box-shadow 0.18s, transform 0.1s;
  cursor: pointer;
  &:hover { box-shadow: 0 5px 16px rgba(0,0,0,0.09); transform: translateY(-1px); }
  &:active { transform: scale(0.995); }
  &--preview { opacity: 0.8; }
}

.gdm-projects__card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.625rem;
  margin-bottom: 0.5rem;
}
.gdm-projects__card-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--gdm-title);
  line-height: 1.3;
  flex: 1;
  min-width: 0;
}
.gdm-projects__badge {
  flex-shrink: 0;
  padding: 0.2rem 0.6rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #fff;
  border-radius: 20px;
}
.gdm-projects__card-client {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--gdm-accent);
  margin-bottom: 0.375rem;
}
.gdm-projects__card-type {
  display: inline-block;
  font-size: 0.75rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.75rem;
}
.gdm-projects__card-dates {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.8125rem;
  margin-bottom: 0.625rem;
}
.gdm-projects__date-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
}
.gdm-projects__date-range { color: #475569; }
.gdm-projects__date-none { color: #cbd5e1; font-style: italic; }

.gdm-projects__progress-track {
  height: 4px;
  background: #f1f5f9;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.875rem;
}
.gdm-projects__progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s;
}

.gdm-projects__card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.gdm-projects__link {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--gdm-accent);
  text-decoration: none;
  &:hover { text-decoration: underline; }
}
.gdm-projects__no-link { flex: 1; }
.gdm-projects__delete-btn {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.6875rem;
  color: #94a3b8;
  padding: 3px 5px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
  &:hover { color: #ef4444; background: #fef2f2; }
}

.gdm-projects__empty {
  padding: 3rem 1rem;
  text-align: center;
  background: #f8fafc;
  border-radius: 10px;
  border: 1.5px dashed #e2e8f0;
}
.gdm-projects__empty-icon { font-size: 2.25rem; margin-bottom: 0.625rem; }
.gdm-projects__empty-text { margin: 0 0 0.25rem; font-weight: 600; color: #475569; }
.gdm-projects__empty-sub { margin: 0; font-size: 0.8125rem; color: #94a3b8; }
</style>
