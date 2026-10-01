export interface DeveloperGroup {
  id: string;
  label: string;
}

export interface DeveloperSection {
  id: string;
  label: string;
  groupId: string;
  icon: string;
  current: string;
  options: string[];
  hint?: string;
}
