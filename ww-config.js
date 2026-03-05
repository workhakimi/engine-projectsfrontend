export default {
  editor: {
    label: { en: 'GDM Projects' },
    icon: 'folder',
    customSettingsPropertiesOrder: [
      'viewMode',
      { label: 'Data', isCollapsible: true, properties: ['projectsData'] },
    ],
    customStylePropertiesOrder: [
      { label: 'Card', isCollapsible: true, properties: ['cardBackgroundColor', 'cardBorderRadius', 'cardPadding'] },
      { label: 'Gantt', isCollapsible: true, properties: ['barBorderRadius', 'ganttDayLineColor', 'ganttWeekLineColor', 'ganttTodayLineColor'] },
      { label: 'Typography', isCollapsible: true, properties: ['fontFamily', 'fontSize', 'titleColor', 'accentColor'] },
    ],
  },
  triggerEvents: [
    {
      name: 'onSaveStructure',
      label: { en: 'On save structure' },
      event: { value: { id: null, structure: { rows: [] } } },
      default: true,
    },
    {
      name: 'onProjectClick',
      label: { en: 'On project click' },
      event: { value: { project: null } },
    },
  ],
  properties: {
    viewMode: {
      label: { en: 'View mode' },
      type: 'TextSelect',
      section: 'settings',
      options: {
        options: [
          { value: 'admin', label: { en: 'Admin – can edit project structure' } },
          { value: 'client', label: { en: 'Client – view only' } },
        ],
      },
      defaultValue: 'admin',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { type: 'string', tooltip: '"admin" or "client"' },
      /* wwEditor:end */
    },
    projectsData: {
      label: { en: 'Projects data' },
      type: 'ObjectList',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip: 'List of project objects. Each should have: id, title, type, status, agreementlink, structure.rows[]',
      },
      /* wwEditor:end */
    },
    cardBackgroundColor: {
      label: { en: 'Card background' },
      type: 'Color',
      section: 'style',
      defaultValue: '#ffffff',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'Card background color' },
      /* wwEditor:end */
    },
    cardBorderRadius: {
      label: { en: 'Card border radius' },
      type: 'Length',
      section: 'style',
      options: { unitChoices: [{ value: 'px', label: 'px', min: 0, max: 28 }] },
      defaultValue: '14px',
      bindable: true,
    },
    cardPadding: {
      label: { en: 'Card padding' },
      type: 'Length',
      section: 'style',
      options: { unitChoices: [{ value: 'px', label: 'px', min: 8, max: 48 }] },
      defaultValue: '24px',
      bindable: true,
    },
    fontFamily: {
      label: { en: 'Font family' },
      type: 'FontFamily',
      section: 'style',
      defaultValue: 'DM Sans, system-ui, sans-serif',
      bindable: true,
    },
    fontSize: {
      label: { en: 'Base font size' },
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
    accentColor: {
      label: { en: 'Accent color' },
      type: 'Color',
      section: 'style',
      defaultValue: '#0d9488',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'Accent / link color' },
      /* wwEditor:end */
    },
    barBorderRadius: {
      label: { en: 'Bar border radius' },
      type: 'Length',
      section: 'style',
      options: { unitChoices: [{ value: 'px', label: 'px', min: 0, max: 12 }] },
      defaultValue: '5px',
      bindable: true,
    },
    ganttDayLineColor: {
      label: { en: 'Day line color' },
      type: 'Color',
      section: 'style',
      defaultValue: '#e8eef4',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'Daily grid line colour' },
      /* wwEditor:end */
    },
    ganttWeekLineColor: {
      label: { en: 'Week line color' },
      type: 'Color',
      section: 'style',
      defaultValue: '#b8c8d8',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'Weekly (Monday) grid line colour' },
      /* wwEditor:end */
    },
    ganttTodayLineColor: {
      label: { en: 'Today line color' },
      type: 'Color',
      section: 'style',
      defaultValue: '#0d9488',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'Today indicator line and label colour' },
      /* wwEditor:end */
    },
  },
};
