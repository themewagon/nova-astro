export type VariantEntry = {
  component: any;
  label?: string;
  props?: Record<string, any>;
  dataKey?: string;
};

export type SectionEntry = {
  id: string;
  label: string;
  groupId: string;
  icon: string;
  defaultVariant: string;
  variants: Record<string, VariantEntry>;
  hint?: string;
};

export type SectionGroup = {
  id: string;
  label: string;
};

export const SECTION_GROUPS: SectionGroup[] = [
  { id: 'theme', label: 'Motyw' },
  { id: 'navbar', label: 'Menu' },
  { id: 'footer', label: 'Footer' },
  { id: 'hero', label: 'Hero' },
  { id: 'about', label: 'O nas' },
  { id: 'trust', label: 'Zaufanie' },
  { id: 'services', label: 'Usługi' },
  { id: 'portfolio', label: 'Realizacje' },
  { id: 'process', label: 'Proces' },
  { id: 'social', label: 'Opinie' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact', label: 'Kontakt' },
  { id: 'cta', label: 'CTA' },
  { id: 'content', label: 'Treść' },
];
