export interface InfoEntry {
  label?: string;
  text: string;
  color?: string;
  icon?: string;
}

export interface InfoContent {
  title: string;
  entries: InfoEntry[];
}
