/**
 * Slash command item data structure
 */
export interface SlashCommandItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  group: 'content' | 'formatting' | 'media';
  command: (editor: any) => void;
}
