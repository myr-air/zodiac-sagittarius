export interface InlineImportAreaProps {
  /** Callback when import is applied with parsed items */
  onApply: (text: string) => void;
  /** Callback to close the import area */
  onCancel: () => void;
}
