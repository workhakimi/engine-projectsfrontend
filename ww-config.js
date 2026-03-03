export default {
  editor: {
    label: { en: 'GDM Projects Frontend' },
    icon: 'folder',
    customSettingsPropertiesOrder: [
      'disableInteractions',
      { label: 'Data', isCollapsible: true, properties: ['projectsData', 'clientsData', 'idFormula', 'titleFormula', 'typeFormula', 'statusFormula', 'startDateFormula', 'endDateFormula', 'agreementLinkFormula', 'clientIdFormula'] },
      { label: 'Layout', isCollapsible: true, properties: ['layoutMode'] },
    ],
    customStylePropertiesOrder: [
      { label: 'Card', isCollapsible: true, properties: ['cardBackgroundColor', 'cardBorderRadius', 'cardPadding'] },
      { label: 'Status badges', isCollapsible: true, properties: ['statusActiveColor', 'statusCompletedColor', 'statusPendingColor'] },
      { label: 'Typography', isCollapsible: true, properties: ['fontFamily', 'fontSize', 'titleColor'] },
    ],
  },
  triggerEvents: [
    {
      name: 'onProjectClick',
      label: { en: 'On project click' },
      event: { value: { project: null } },
      default: true,
    },
  ],
  properties: {
    disableInteractions: {
      label: { en: 'Disable interactions' },
      type: 'OnOff',
      section: 'settings',
      defaultValue: false,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { type: 'boolean', tooltip: 'When true, project cards are not clickable' },
      /* wwEditor:end */
    },
    projectsData: {
      label: { en: 'Projects data' },
      type: 'ObjectList',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      /* wwEditor:start */
      bindingValidation: { type: 'array', tooltip: 'List of projects from Supabase' },
      /* wwEditor:end */
    },
    clientsData: {
      label: { en: 'Clients data (optional)' },
      type: 'ObjectList',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      /* wwEditor:start */
      bindingValidation: { type: 'array', tooltip: 'List of clients for company name lookup' },
      /* wwEditor:end */
    },
    idFormula: {
      label: { en: 'ID field' },
      type: 'Formula',
      section: 'settings',
      options: (content) => ({
        template: Array.isArray(content.projectsData) && content.projectsData.length > 0 ? content.projectsData[0] : null,
      }),
      defaultValue: { type: 'f', code: "context.mapping?.['id'] ?? context.id ?? ''" },
      hidden: (content, sidepanelContent, boundProps) => !boundProps?.projectsData,
    },
    titleFormula: {
      label: { en: 'Title field' },
      type: 'Formula',
      section: 'settings',
      options: (content) => ({
        template: Array.isArray(content.projectsData) && content.projectsData.length > 0 ? content.projectsData[0] : null,
      }),
      defaultValue: { type: 'f', code: "context.mapping?.['title'] ?? context.title ?? ''" },
      hidden: (content, sidepanelContent, boundProps) => !boundProps?.projectsData,
    },
    typeFormula: {
      label: { en: 'Type field' },
      type: 'Formula',
      section: 'settings',
      options: (content) => ({
        template: Array.isArray(content.projectsData) && content.projectsData.length > 0 ? content.projectsData[0] : null,
      }),
      defaultValue: { type: 'f', code: "context.mapping?.['type'] ?? context.type ?? ''" },
      hidden: (content, sidepanelContent, boundProps) => !boundProps?.projectsData,
    },
    statusFormula: {
      label: { en: 'Status field' },
      type: 'Formula',
      section: 'settings',
      options: (content) => ({
        template: Array.isArray(content.projectsData) && content.projectsData.length > 0 ? content.projectsData[0] : null,
      }),
      defaultValue: { type: 'f', code: "context.mapping?.['status'] ?? context.status ?? ''" },
      hidden: (content, sidepanelContent, boundProps) => !boundProps?.projectsData,
    },
    startDateFormula: {
      label: { en: 'Start date field' },
      type: 'Formula',
      section: 'settings',
      options: (content) => ({
        template: Array.isArray(content.projectsData) && content.projectsData.length > 0 ? content.projectsData[0] : null,
      }),
      defaultValue: { type: 'f', code: "context.mapping?.['start_date'] ?? context.start_date ?? ''" },
      hidden: (content, sidepanelContent, boundProps) => !boundProps?.projectsData,
    },
    endDateFormula: {
      label: { en: 'End date field' },
      type: 'Formula',
      section: 'settings',
      options: (content) => ({
        template: Array.isArray(content.projectsData) && content.projectsData.length > 0 ? content.projectsData[0] : null,
      }),
      defaultValue: { type: 'f', code: "context.mapping?.['end_date'] ?? context.end_date ?? ''" },
      hidden: (content, sidepanelContent, boundProps) => !boundProps?.projectsData,
    },
    agreementLinkFormula: {
      label: { en: 'Agreement link field' },
      type: 'Formula',
      section: 'settings',
      options: (content) => ({
        template: Array.isArray(content.projectsData) && content.projectsData.length > 0 ? content.projectsData[0] : null,
      }),
      defaultValue: { type: 'f', code: "context.mapping?.['agreementlink'] ?? context.agreementlink ?? ''" },
      hidden: (content, sidepanelContent, boundProps) => !boundProps?.projectsData,
    },
    clientIdFormula: {
      label: { en: 'Client ID field' },
      type: 'Formula',
      section: 'settings',
      options: (content) => ({
        template: Array.isArray(content.projectsData) && content.projectsData.length > 0 ? content.projectsData[0] : null,
      }),
      defaultValue: { type: 'f', code: "context.mapping?.['client_id'] ?? context.client_id ?? ''" },
      hidden: (content, sidepanelContent, boundProps) => !boundProps?.projectsData,
    },
    layoutMode: {
      label: { en: 'Layout' },
      type: 'TextSelect',
      section: 'settings',
      options: {
        options: [
          { value: 'list', label: { en: 'Card list' } },
          { value: 'grid', label: { en: 'Card grid' } },
        ],
      },
      defaultValue: 'list',
    },
    cardBackgroundColor: {
      label: { en: 'Card background' },
      type: 'Color',
      section: 'style',
      defaultValue: '#ffffff',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'Card background' },
      /* wwEditor:end */
    },
    cardBorderRadius: {
      label: { en: 'Card border radius' },
      type: 'Length',
      section: 'style',
      options: { unitChoices: [{ value: 'px', label: 'px', min: 0, max: 24 }] },
      defaultValue: '10px',
      bindable: true,
    },
    cardPadding: {
      label: { en: 'Card padding' },
      type: 'Length',
      section: 'style',
      options: { unitChoices: [{ value: 'px', label: 'px', min: 0, max: 32 }] },
      defaultValue: '20px',
      bindable: true,
    },
    statusActiveColor: {
      label: { en: 'Active status color' },
      type: 'Color',
      section: 'style',
      defaultValue: '#0d9488',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'Active/in-progress status' },
      /* wwEditor:end */
    },
    statusCompletedColor: {
      label: { en: 'Completed status color' },
      type: 'Color',
      section: 'style',
      defaultValue: '#10b981',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'Completed status' },
      /* wwEditor:end */
    },
    statusPendingColor: {
      label: { en: 'Pending status color' },
      type: 'Color',
      section: 'style',
      defaultValue: '#f59e0b',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'Pending status' },
      /* wwEditor:end */
    },
    fontFamily: {
      label: { en: 'Font family' },
      type: 'FontFamily',
      section: 'style',
      defaultValue: 'DM Sans, system-ui, sans-serif',
      bindable: true,
    },
    fontSize: {
      label: { en: 'Font size' },
      type: 'Length',
      section: 'style',
      options: { unitChoices: [{ value: 'px', label: 'px', min: 12, max: 20 }] },
      defaultValue: '15px',
      bindable: true,
      responsive: true,
    },
    titleColor: {
      label: { en: 'Title color' },
      type: 'Color',
      section: 'style',
      defaultValue: '#1e293b',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'Project title color' },
      /* wwEditor:end */
    },
  },
};
