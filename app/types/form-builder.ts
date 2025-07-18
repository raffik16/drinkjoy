/**
 * Form builder type definitions
 */

export type PageState = 'focused' | 'default' | 'hover';

export interface FormPage {
  id: string;
  title: string;
  type: 'info' | 'details' | 'other' | 'ending';
  isActive?: boolean;
}

export interface SectionDetailProps {
  page: FormPage;
  state: PageState;
  onMenuOpen?: () => void;
}

export interface SettingsPosition {
  x: number;
  y: number;
}

export interface SectionLegendProps {
  pages: FormPage[];
  activePageId?: string;
  settingsPageId?: string | null;
  renamingPageId?: string | null;
  renameValue?: string;
  onPageSelect: (pageId: string) => void;
  onPageAdd: (afterPageId?: string) => void;
  onPageReorder: (draggedId: string, targetId: string) => void;
  onSettingsClick: (pageId: string | null, position?: SettingsPosition) => void;
  onRenameStart?: (pageId: string, currentTitle: string) => void;
  onRenameChange?: (value: string) => void;
  onRenameSubmit?: () => void;
  onRenameCancel?: () => void;
}

export interface SectionSettingsProps {
  pageId: string;
  onClose: () => void;
  onSetFirst?: () => void;
  onRename?: () => void;
  onCopy?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export interface AddPageButtonProps {
  onClick: () => void;
  isInline?: boolean;
}

export interface PageItemProps {
  page: FormPage;
  isActive: boolean;
  isDragging?: boolean;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}