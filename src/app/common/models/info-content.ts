export interface InfoEntry {
  label?: string;
  text: string;
  color?: string;
  icon?: string;
}

export interface InfoContent {
  /** Stable key used to track "don't show again" per hint on mobile. Omit for hints that should never open a modal. */
  id?: string;
  title: string;
  entries: InfoEntry[];
}
