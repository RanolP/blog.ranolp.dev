/**
 * Mention item data structure
 */
export interface MentionItem {
  id: string;
  label: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  verified?: boolean;
}
