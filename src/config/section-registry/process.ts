import type { SectionEntry } from './types';

const icon = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>';

export const processSections: Record<string, SectionEntry> = {
  processTimeline: {
    id: 'processTimeline', label: 'Proces z osią czasu', groupId: 'process', hint: 'Oś czasu kroków z paskiem postępu', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'ProcessTimelineBlock', dataKey: 'process-timeline' } },
  },
  processTimelineScroll: {
    id: 'processTimelineScroll', label: 'Proces scroll', groupId: 'process', hint: 'Oś czasu sterowana przewijaniem', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'ProcessTimelineScrollBlock', dataKey: 'process-timeline-scroll' } },
  },
  processIconSteps: {
    id: 'processIconSteps', label: 'Proces z ikonami', groupId: 'process', hint: 'Kroki procesu z ikonami i strzałkami', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'ProcessIconStepsBlock', dataKey: 'process-icon-steps' } },
  },
  timelineAlternate: {
    id: 'timelineAlternate', label: 'Oś czasu naprzemienna', groupId: 'process', hint: 'Naprzemienna oś czasu z animowaną linią', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'TimelineAlternateBlock', dataKey: 'timeline-alternate' } },
  },
  stepsNumbered: {
    id: 'stepsNumbered', label: 'Kroki numerowane', groupId: 'process', hint: 'Kroki z numerami i strzałkami', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'StepsNumberedBlock', dataKey: 'steps-numbered' } },
  },
};
