import { useCallback, useRef, useState } from "react";
import type { BudgetCategoryCardProps } from "./BudgetCategoryCard.types";
import { BudgetProgressBar } from "./BudgetProgressBar";
import { amountsClass, cardClass, cardHeaderClass, categoryNameClass, editButtonClass } from "./BudgetCategoryCard.styles";

export function BudgetCategoryCard({ category, onEdit, iconName }: BudgetCategoryCardProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(category.estimated));
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggleEdit = useCallback(() => {
    if (!editing) {
      setEditValue(String(category.estimated));
      setEditing(true);
      // Focus after render
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [editing, category.estimated]);

  const handleSave = useCallback(() => {
    const parsed = Number(editValue);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      onEdit(category.id, { estimated: parsed });
    }
    setEditing(false);
  }, [editValue, category.id, onEdit]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setEditValue(String(category.estimated));
  }, [category.estimated]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSave();
      if (e.key === "Escape") handleCancel();
    },
    [handleSave, handleCancel],
  );

  return (
    <div className={cardClass} data-testid="budget-category-card">
      <div className={cardHeaderClass}>
        {iconName && <span data-testid="category-icon">{iconName}</span>}
        <span className={categoryNameClass}>{category.category}</span>
        <button
          type="button"
          className={editButtonClass}
          onClick={handleToggleEdit}
          aria-label="Edit budget"
          data-testid="edit-budget-button"
        >
          ✏️
        </button>
      </div>

      <div className={amountsClass}>
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            className="w-24 px-2 py-1 border border-(--color-border) rounded text-sm"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            data-testid="budget-edit-input"
            min={0}
          />
        ) : (
          <>
            <span data-testid="allocated-label">Allocated: ฿{category.estimated.toLocaleString()}</span>
            <span data-testid="spent-label">Spent: ฿{category.actual.toLocaleString()}</span>
          </>
        )}
      </div>

      <BudgetProgressBar spent={category.actual} max={category.estimated} />
    </div>
  );
}
