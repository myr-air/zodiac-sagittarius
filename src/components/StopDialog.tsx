import { useState, type FormEvent } from "react";
import type { ActivityType, ItineraryItem } from "@/src/trip/types";
import { Button } from "./ui";
import { Icon } from "./icons";

export interface StopFormValues {
  startTime: string;
  activity: string;
  activityType: ActivityType;
  place: string;
  durationMinutes: number;
  transportation: string;
  note: string;
}

interface StopDialogProps {
  mode: "create" | "edit";
  initialItem?: ItineraryItem;
  onClose: () => void;
  onSubmit: (values: StopFormValues) => void;
}

const activityTypeOptions: Array<{ value: ActivityType; label: string }> = [
  { value: "food", label: "อาหาร" },
  { value: "attraction", label: "สถานที่" },
  { value: "experience", label: "กิจกรรม" },
  { value: "travel", label: "เดินทาง" },
  { value: "shopping", label: "ช้อปปิ้ง" },
  { value: "stay", label: "ที่พัก" },
];

export function StopDialog({ mode, initialItem, onClose, onSubmit }: StopDialogProps) {
  const [values, setValues] = useState<StopFormValues>(() => ({
    startTime: initialItem?.startTime ?? "16:30",
    activity: initialItem?.activity ?? "",
    activityType: initialItem?.activityType ?? "experience",
    place: initialItem?.place ?? "",
    durationMinutes: initialItem?.durationMinutes ?? 45,
    transportation: initialItem?.transportation ?? "",
    note: initialItem?.note ?? "",
  }));

  const title = mode === "create" ? "เพิ่มกิจกรรม" : "แก้ไขรายละเอียด";

  function update<K extends keyof StopFormValues>(key: K, value: StopFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      ...values,
      activity: values.activity.trim(),
      place: values.place.trim(),
      transportation: values.transportation.trim(),
      note: values.note.trim(),
      durationMinutes: Math.max(1, Number(values.durationMinutes) || 1),
    });
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="stop-dialog" role="dialog" aria-modal="true" aria-labelledby="stop-dialog-title">
        <div className="dialog-title-row">
          <h2 id="stop-dialog-title">{title}</h2>
          <button type="button" aria-label="ปิดฟอร์ม" onClick={onClose}>
            <Icon name="chevronRight" />
          </button>
        </div>

        <form className="stop-form" onSubmit={handleSubmit}>
          <div className="dialog-grid">
            <label>
              <span>เวลา</span>
              <input value={values.startTime} onChange={(event) => update("startTime", event.target.value)} placeholder="08:30" required />
            </label>
            <label>
              <span>ระยะเวลา</span>
              <input
                min={1}
                type="number"
                value={values.durationMinutes}
                onChange={(event) => update("durationMinutes", Number(event.target.value))}
                required
              />
            </label>
            <label className="dialog-field-wide">
              <span>กิจกรรม</span>
              <input value={values.activity} onChange={(event) => update("activity", event.target.value)} required />
            </label>
            <label>
              <span>ประเภท</span>
              <select value={values.activityType} onChange={(event) => update("activityType", event.target.value as ActivityType)}>
                {activityTypeOptions.map((option) => (
                  <option value={option.value} key={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>สถานที่</span>
              <input value={values.place} onChange={(event) => update("place", event.target.value)} required />
            </label>
            <label className="dialog-field-wide">
              <span>การเดินทาง</span>
              <input value={values.transportation} onChange={(event) => update("transportation", event.target.value)} />
            </label>
            <label className="dialog-field-wide">
              <span>โน้ต</span>
              <textarea value={values.note} onChange={(event) => update("note", event.target.value)} rows={3} />
            </label>
          </div>

          <div className="dialog-actions">
            <Button type="button" variant="ghost" onClick={onClose}>ยกเลิก</Button>
            <Button type="submit">{mode === "create" ? "บันทึกกิจกรรม" : "บันทึกการแก้ไข"}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
