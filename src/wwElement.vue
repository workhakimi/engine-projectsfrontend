<template>
  <div class="gdm-projects" :style="wrapperStyles">
    <div
      class="gdm-projects__grid"
      :class="{ 'gdm-projects__grid--grid': content?.layoutMode === 'grid' }"
    >
      <div
        v-for="proj in projectsList"
        :key="getProjectId(proj)"
        class="gdm-projects__card"
        :style="cardStyles"
        :class="{ 'gdm-projects__card--disabled': content?.disableInteractions }"
        @click="handleProjectClick(proj)"
      >
        <div class="gdm-projects__card-header">
          <h3 class="gdm-projects__card-title" :style="{ color: content?.titleColor || '#1e293b' }">
            {{ getProjectTitle(proj) }}
          </h3>
          <span
            class="gdm-projects__badge"
            :style="getStatusBadgeStyles(getProjectStatus(proj))"
          >
            {{ getProjectStatus(proj) || '—' }}
          </span>
        </div>
        <div v-if="getProjectType(proj)" class="gdm-projects__card-type">
          {{ getProjectType(proj) }}
        </div>
        <div v-if="getClientName(proj)" class="gdm-projects__card-client">
          {{ getClientName(proj) }}
        </div>
        <div class="gdm-projects__card-dates">
          <span v-if="getStartDate(proj)">{{ formatDate(getStartDate(proj)) }}</span>
          <span v-if="getStartDate(proj) && getEndDate(proj)"> – </span>
          <span v-if="getEndDate(proj)">{{ formatDate(getEndDate(proj)) }}</span>
          <span v-if="!getStartDate(proj) && !getEndDate(proj)" class="gdm-projects__card-dates-empty">—</span>
        </div>
        <a
          v-if="getAgreementLink(proj)"
          :href="getAgreementLink(proj)"
          class="gdm-projects__card-link"
          target="_blank"
          rel="noopener noreferrer"
          @click.stop
        >
          View agreement
        </a>
      </div>
    </div>
    <div v-if="projectsList.length === 0" class="gdm-projects__empty">
      No projects
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

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
    const resolveMappingFormula =
      typeof wwLib !== 'undefined' && wwLib?.wwFormula?.useFormula
        ? wwLib.wwFormula.useFormula().resolveMappingFormula
        : () => undefined;

    const projectsList = computed(() => {
      const data = props.content?.projectsData;
      if (!data) return [];
      const arr = typeof wwLib !== 'undefined' && wwLib?.wwUtils?.getDataFromCollection
        ? wwLib.wwUtils.getDataFromCollection(data)
        : props.content?.projectsData;
      return Array.isArray(arr) ? arr : [];
    });

    const clientsMap = computed(() => {
      const data = props.content?.clientsData;
      if (!data) return {};
      const arr = typeof wwLib !== 'undefined' && wwLib?.wwUtils?.getDataFromCollection
        ? wwLib.wwUtils.getDataFromCollection(data)
        : props.content?.clientsData;
      if (!Array.isArray(arr)) return {};
      const map = {};
      arr.forEach((c) => {
        const id = c.id;
        if (id) map[id] = c.company_name ?? c.contact_name ?? 'Unknown';
      });
      return map;
    });

    const getProjectId = (item) =>
      resolveMappingFormula(props.content?.idFormula, item) ?? item.id ?? '';

    const getProjectTitle = (item) =>
      resolveMappingFormula(props.content?.titleFormula, item) ?? item.title ?? 'Untitled';

    const getProjectType = (item) =>
      resolveMappingFormula(props.content?.typeFormula, item) ?? item.type ?? '';

    const getProjectStatus = (item) =>
      resolveMappingFormula(props.content?.statusFormula, item) ?? item.status ?? '';

    const getStartDate = (item) =>
      resolveMappingFormula(props.content?.startDateFormula, item) ?? item.start_date ?? '';

    const getEndDate = (item) =>
      resolveMappingFormula(props.content?.endDateFormula, item) ?? item.end_date ?? '';

    const getAgreementLink = (item) =>
      resolveMappingFormula(props.content?.agreementLinkFormula, item) ?? item.agreementlink ?? '';

    const getClientId = (item) =>
      resolveMappingFormula(props.content?.clientIdFormula, item) ?? item.client_id ?? '';

    const getClientName = (item) => {
      const id = getClientId(item);
      return id ? clientsMap.value[id] || '' : '';
    };

    const formatDate = (d) => {
      if (!d) return '';
      try {
        const date = typeof d === 'string' ? new Date(d) : d;
        return isNaN(date.getTime()) ? String(d) : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      } catch {
        return String(d);
      }
    };

    const normalizeStatus = (s) => {
      if (s == null || s === '') return '';
      return String(s).toLowerCase().trim();
    };

    const getStatusBadgeStyles = (status) => {
      const s = normalizeStatus(status);
      let bg = props.content?.statusPendingColor || '#f59e0b';
      if (s === 'active' || s === 'in progress' || s === 'in_progress') {
        bg = props.content?.statusActiveColor || '#0d9488';
      } else if (s === 'completed' || s === 'done') {
        bg = props.content?.statusCompletedColor || '#10b981';
      }
      return { backgroundColor: bg };
    };

    const handleProjectClick = (project) => {
      /* wwEditor:start */
      if (props.wwEditorState?.isEditing || props.content?.disableInteractions) return;
      /* wwEditor:end */
      if (props.content?.disableInteractions) return;
      emit('trigger-event', { name: 'onProjectClick', event: { value: { project } } });
    };

    const wrapperStyles = computed(() => ({
      fontFamily: props.content?.fontFamily || 'DM Sans, system-ui, sans-serif',
      fontSize: props.content?.fontSize || '15px',
    }));

    const cardStyles = computed(() => ({
      backgroundColor: props.content?.cardBackgroundColor || '#ffffff',
      borderRadius: props.content?.cardBorderRadius || '10px',
      padding: props.content?.cardPadding || '20px',
    }));

    return {
      content: computed(() => props.content),
      projectsList,
      wrapperStyles,
      cardStyles,
      getProjectId,
      getProjectTitle,
      getProjectType,
      getProjectStatus,
      getStartDate,
      getEndDate,
      getAgreementLink,
      getClientName,
      formatDate,
      getStatusBadgeStyles,
      handleProjectClick,
    };
  },
};
</script>

<style lang="scss" scoped>
.gdm-projects {
  width: 100%;
}

.gdm-projects__grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &--grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

.gdm-projects__card {
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.02s;

  &:hover:not(.gdm-projects__card--disabled) {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &:active:not(.gdm-projects__card--disabled) {
    transform: scale(0.99);
  }

  &--disabled {
    cursor: default;
  }
}

.gdm-projects__card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.gdm-projects__card-title {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.3;
  flex: 1;
  min-width: 0;
}

.gdm-projects__badge {
  flex-shrink: 0;
  padding: 0.2rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #fff;
  border-radius: 4px;
}

.gdm-projects__card-type {
  font-size: 0.8125rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.gdm-projects__card-client {
  font-size: 0.8125rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.gdm-projects__card-dates {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;

  &-empty {
    font-style: italic;
  }
}

.gdm-projects__card-link {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #0d9488;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.gdm-projects__empty {
  font-size: 0.9375rem;
  color: #94a3b8;
  font-style: italic;
  padding: 2rem;
  text-align: center;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #e2e8f0;
}
</style>
