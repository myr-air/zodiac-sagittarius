import { type FormEvent, useMemo, useState } from "react";
import type { ExpenseSummary, ItineraryItem, Member, Suggestion, Trip, TripTask } from "@/src/trip/types";
import { formatDayLabel, getTripDates, validateItineraryItem } from "@/src/trip/itinerary";
import { Icon } from "./icons";
import { TravelMotif } from "./motifs";
import { formatTripRange, PageHeader, PageUserCard } from "./PageHeader";

interface OverviewPageProps {
  trip: Trip;
  currentMemberId: string;
  expenseSummary: ExpenseSummary;
  items: ItineraryItem[];
  suggestions: Suggestion[];
  tasks: TripTask[];
  onCreateTask: (input: { title: string; visibility: TripTask["visibility"]; assigneeId?: string | null }) => void;
  onToggleTaskStatus: (taskId: string) => void;
}

export function OverviewPage({ trip, currentMemberId, expenseSummary, items, suggestions, tasks, onCreateTask, onToggleTaskStatus }: OverviewPageProps) {
  const [taskScope, setTaskScope] = useState<"mine" | "trip" | "all">("mine");
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | "open" | "done">("all");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskVisibility, setNewTaskVisibility] = useState<TripTask["visibility"]>("private");
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState("");
  const tripDays = getTripDates(trip.startDate, trip.endDate);
  /* v8 ignore next */
  const sortedItems = useMemo(() => items.slice().sort((a, b) => a.day.localeCompare(b.day) || a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime)), [items]);
  const nextStop = sortedItems[0];
  const warningCount = items.reduce((total, item) => total + validateItineraryItem(item, items.filter((candidate) => candidate.day === item.day)).length, 0);
  const pendingSuggestions = suggestions.filter((suggestion) => suggestion.status === "pending").length;
  const activeMembers = trip.members.filter((member) => member.id !== "member-viewer" && member.accessStatus !== "disabled").length;
  const currentMember = trip.members.find((member) => member.id === currentMemberId);
  /* v8 ignore next */
  const currentMemberCard = currentMember ? <PageUserCard color={currentMember.color} name={currentMember.displayName} label={trip.destinationLabel} /> : null;
  const roleLens = overviewRoleLens(currentMember);
  const isManagerLens = roleLens === "manager";
  const isTravelerLens = roleLens === "traveler";
  const isViewerLens = roleLens === "viewer";
  const assignableMembers = trip.members.filter((member) => member.id !== "member-viewer" && member.accessStatus !== "disabled");
  const myOpenTasks = tasks.filter((task) => task.status === "open" && isMyTask(task, currentMemberId)).length;
  const sharedOpenTasks = tasks.filter((task) => task.status === "open" && task.visibility === "shared").length;
  const nextDayItems = nextStop ? sortedItems.filter((item) => item.day === nextStop.day).slice(0, 4) : [];
  const foodStops = sortedItems.filter((item) => item.activityType === "food").slice(0, 3);
  const tripHighlights = sortedItems.filter((item) => ["attraction", "experience", "shopping"].includes(item.activityType)).slice(0, 4);
  const viewerHighlights = sortedItems.filter((item) => item.activityType !== "travel").slice(0, 5);
  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (taskScope === "mine" && !isMyTask(task, currentMemberId)) return false;
        if (taskScope === "trip" && task.visibility !== "shared") return false;
        if (taskStatusFilter === "open") return task.status === "open";
        if (taskStatusFilter === "done") return task.status === "done";
        return true;
      }),
    [currentMemberId, taskScope, taskStatusFilter, tasks],
  );

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;
    onCreateTask({ title, visibility: newTaskVisibility, assigneeId: newTaskAssigneeId || null });
    setNewTaskTitle("");
    setNewTaskVisibility("private");
    setNewTaskAssigneeId("");
    setTaskScope(newTaskVisibility === "shared" ? "trip" : "mine");
    setTaskStatusFilter("all");
    setIsTaskDialogOpen(false);
  }

  function closeTaskDialog() {
    setIsTaskDialogOpen(false);
    setNewTaskTitle("");
    setNewTaskVisibility("private");
    setNewTaskAssigneeId("");
  }

  return (
    <section className="overview-page" aria-label="Trip overview">
      <PageHeader
        title={roleHeading(roleLens)}
        subtitle={trip.name}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(trip.startDate, trip.endDate)}</span>
            <span><Icon name="location" /> {trip.destinationLabel}</span>
            <span><Icon name="users" /> {activeMembers} สมาชิก</span>
          </>
        )}
        motif={<TravelMotif tone="postcard" />}
        aside={currentMemberCard}
      />

      <div className="overview-stat-grid" aria-label="Trip summary">
        <OverviewStat icon="calendar" label="ระยะทริป" value={`${tripDays.length} วัน`} />
        <OverviewStat icon="location" label="กิจกรรมในแผน" value={`${items.length} จุด`} />
        <OverviewStat icon="wallet" label="ค่าใช้จ่ายรวม" value={`HK$${expenseSummary.groupSpend.toLocaleString("en-HK")}`} />
        <OverviewStat icon="users" label="สมาชิกที่ใช้งาน" value={`${activeMembers} คน`} />
      </div>

      <div className="overview-grid">
        {isTravelerLens ? (
          <>
            <section className="overview-panel overview-panel--wide" aria-label="Today and next focus">
              <div className="overview-panel-title">
                <Icon name="route" />
                <h2>วันนี้ต้องโฟกัส</h2>
              </div>
              {nextStop ? (
                <div className="overview-next-stop">
                  <strong>{nextStop.activity}</strong>
                  <span>{formatDayLabel(nextStop.day, trip.startDate)} · {nextStop.startTime} · {nextStop.place}</span>
                  <p>{travelerNextStopDetail(nextStop)}</p>
                </div>
              ) : (
                <p className="overview-muted">ยังไม่มี itinerary ในแผนนี้</p>
              )}
              <OverviewFocusList items={nextDayItems} startDate={trip.startDate} />
            </section>

            <section className="overview-panel overview-panel--wide" aria-label="Traveler highlights">
              <div className="overview-panel-title">
                <Icon name="location" />
                <h2>ที่เที่ยวและของกินที่รออยู่</h2>
              </div>
              <OverviewStopList items={[...foodStops, ...tripHighlights].slice(0, 5)} startDate={trip.startDate} />
            </section>

            <section className="overview-panel overview-task-panel" aria-label="My travel checklist">
              <div className="overview-panel-title">
                <Icon name="check" />
                <h2>เช็กลิสต์ของฉัน</h2>
              </div>
              <div className="overview-task-toolbar">
                <div className="overview-task-filters" role="group" aria-label="Checklist status filters">
                  <button className={taskStatusFilter === "all" ? "overview-task-filter overview-task-filter--active" : "overview-task-filter"} type="button" onClick={() => setTaskStatusFilter("all")}>ทั้งหมด</button>
                  <button className={taskStatusFilter === "open" ? "overview-task-filter overview-task-filter--active" : "overview-task-filter"} type="button" onClick={() => setTaskStatusFilter("open")}>ยังไม่ได้ทำ</button>
                  <button className={taskStatusFilter === "done" ? "overview-task-filter overview-task-filter--active" : "overview-task-filter"} type="button" onClick={() => setTaskStatusFilter("done")}>เรียบร้อย</button>
                </div>
              </div>
              <form className="overview-task-form overview-task-form--personal" onSubmit={submitTask}>
                <label>
                  <span>เพิ่มของที่ต้องเตรียม</span>
                  <input value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="เช่น เตรียมปลั๊กแปลง" />
                </label>
                <button type="submit" disabled={!newTaskTitle.trim()}>เพิ่ม</button>
              </form>
              {visibleTasks.length ? (
                <ul className="overview-task-list">
                  {visibleTasks.map((task) => (
                    <li className="overview-task-item" key={task.id} aria-label={task.title} data-status={task.status}>
                      <label>
                        <input type="checkbox" checked={task.status === "done"} onChange={() => onToggleTaskStatus(task.id)} />
                        <span>{task.title}</span>
                      </label>
                      <div className="overview-task-meta">
                        <small className={`overview-task-scope overview-task-scope--${task.visibility}`}>{task.visibility === "private" ? "ส่วนตัว" : "แชร์ในทริป"}</small>
                        <small>{assigneeLabel(task, trip)}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="overview-muted">ยังไม่มีเช็กลิสต์ของคุณ</p>
              )}
            </section>

            <section className="overview-panel" aria-label="Trip money snapshot">
              <div className="overview-panel-title">
                <Icon name="wallet" />
                <h2>เงินทริปของฉัน</h2>
              </div>
              <strong>{expenseSummary.currentUserNetLabel}</strong>
              <span>{expenseSummary.settlementSuggestions.length} รายการชำระคืนที่แนะนำ</span>
            </section>
          </>
        ) : null}

        {isViewerLens ? (
          <>
            <section className="overview-panel overview-panel--wide" aria-label="Read-only trip snapshot">
              <div className="overview-panel-title">
                <Icon name="location" />
                <h2>ภาพรวมที่จะได้เจอ</h2>
              </div>
              <OverviewStopList items={viewerHighlights} startDate={trip.startDate} />
            </section>

            <section className="overview-panel" aria-label="Next important stop">
              <div className="overview-panel-title">
                <Icon name="route" />
                <h2>จุดถัดไป</h2>
              </div>
              {viewerNextStopPanel(nextStop, trip.startDate)}
            </section>

            <section className="overview-panel" aria-label="Budget snapshot">
              <div className="overview-panel-title">
                <Icon name="wallet" />
                <h2>งบทริปโดยรวม</h2>
              </div>
              <strong>HK${expenseSummary.groupSpend.toLocaleString("en-HK")}</strong>
              <span>สรุปรายจ่ายรวมของทริป</span>
            </section>
          </>
        ) : null}

        {isManagerLens ? (
          <>
            <section className="overview-panel overview-panel--wide" aria-label="Today and next focus">
          <div className="overview-panel-title">
            <Icon name="route" />
            <h2>วันนี้ต้องโฟกัส</h2>
          </div>
          {nextStop ? (
            <div className="overview-next-stop">
              <strong>{nextStop.activity}</strong>
              <span>{formatDayLabel(nextStop.day, trip.startDate)} · {nextStop.startTime} · {nextStop.place}</span>
              <p>{managerNextStopDetail(nextStop)}</p>
            </div>
          ) : (
            <p className="overview-muted">ยังไม่มี itinerary ในแผนนี้</p>
          )}
          <OverviewFocusList items={nextDayItems} startDate={trip.startDate} />
            </section>

            <section className="overview-panel overview-panel--health" aria-label="Trip readiness">
          <div className="overview-panel-title">
            <Icon name="check" />
            <h2>ความพร้อมก่อนเดินทาง</h2>
          </div>
          <div className="overview-health-grid">
            <span><strong>{myOpenTasks}</strong> เช็กลิสต์ของฉัน</span>
            <span><strong>{sharedOpenTasks}</strong> เช็กลิสต์ที่แชร์</span>
            <span><strong>{pendingSuggestions}</strong> เรื่องรอคุย</span>
          </div>
            </section>

            <section className="overview-panel" aria-label="Planning alerts">
          <div className="overview-panel-title">
            <Icon name="alertCircle" />
            <h2>การแจ้งเตือน</h2>
          </div>
          <strong>{warningCount + pendingSuggestions}</strong>
          <span>{warningCount} จุดควรตรวจ และ {pendingSuggestions} ข้อเสนอรอพิจารณา</span>
            </section>

            <section className="overview-panel" aria-label="Budget snapshot">
          <div className="overview-panel-title">
            <Icon name="wallet" />
            <h2>งบประมาณ</h2>
          </div>
          <strong>{expenseSummary.currentUserNetLabel}</strong>
          <span>{expenseSummary.settlementSuggestions.length} รายการชำระคืนที่แนะนำ</span>
            </section>

            <section className="overview-panel overview-task-panel" aria-label="Trip checklist">
          <div className="overview-panel-title">
            <Icon name="check" />
            <h2>เช็กลิสต์ทริปและการเตรียมตัว</h2>
          </div>
          <div className="overview-task-toolbar">
            <div className="overview-task-filters" role="group" aria-label="Checklist scope filters">
              <button className={taskScope === "mine" ? "overview-task-filter overview-task-filter--active" : "overview-task-filter"} type="button" onClick={() => setTaskScope("mine")}>ของฉัน</button>
              <button className={taskScope === "trip" ? "overview-task-filter overview-task-filter--active" : "overview-task-filter"} type="button" onClick={() => setTaskScope("trip")}>แชร์ในทริป</button>
              <button className={taskScope === "all" ? "overview-task-filter overview-task-filter--active" : "overview-task-filter"} type="button" onClick={() => setTaskScope("all")}>ทั้งหมด</button>
            </div>
            <div className="overview-task-filters" role="group" aria-label="Checklist status filters">
              <button className={taskStatusFilter === "all" ? "overview-task-filter overview-task-filter--active" : "overview-task-filter"} type="button" onClick={() => setTaskStatusFilter("all")}>ทุกสถานะ</button>
              <button className={taskStatusFilter === "open" ? "overview-task-filter overview-task-filter--active" : "overview-task-filter"} type="button" onClick={() => setTaskStatusFilter("open")}>ค้าง</button>
              <button className={taskStatusFilter === "done" ? "overview-task-filter overview-task-filter--active" : "overview-task-filter"} type="button" onClick={() => setTaskStatusFilter("done")}>เสร็จแล้ว</button>
            </div>
            <button className="overview-task-add-button" type="button" aria-label="เพิ่มเช็กลิสต์" title="เพิ่มเช็กลิสต์" onClick={() => setIsTaskDialogOpen(true)}>
              <span aria-hidden="true">+</span>
            </button>
          </div>
          {visibleTasks.length ? (
            <ul className="overview-task-list">
              {visibleTasks.map((task) => (
                <li className="overview-task-item" key={task.id} aria-label={task.title} data-status={task.status}>
                  <label>
                    <input type="checkbox" checked={task.status === "done"} onChange={() => onToggleTaskStatus(task.id)} />
                    <span>{task.title}</span>
                  </label>
                  <div className="overview-task-meta">
                    <small className={`overview-task-scope overview-task-scope--${task.visibility}`}>{task.visibility === "private" ? "ส่วนตัว" : "แชร์ในทริป"}</small>
                    <small>{taskKindLabel(task)}</small>
                    <small>{task.relatedItemId ? stopLabel(task.relatedItemId, items) : assigneeLabel(task, trip)}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="overview-muted">ไม่มีงานในตัวกรองนี้</p>
          )}
            </section>
          </>
        ) : null}
      </div>
      {isTaskDialogOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="stop-dialog overview-task-dialog" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title">
            <div className="dialog-title-row">
              <h2 id="task-dialog-title">เพิ่มเช็กลิสต์</h2>
              <button type="button" aria-label="ปิดฟอร์ม" onClick={closeTaskDialog}>
                <Icon name="x" />
              </button>
            </div>

            <form className="overview-task-form overview-task-form--dialog" onSubmit={submitTask}>
              <div className="dialog-grid">
                <label className="dialog-field-wide">
                  <span>เพิ่มเช็กลิสต์</span>
                  <input value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="เช่น จองร้านอาหาร" />
                </label>
                <label>
                  <span>เก็บไว้ที่</span>
                  <select value={newTaskVisibility} onChange={(event) => setNewTaskVisibility(event.target.value as TripTask["visibility"])}>
                    <option value="private">ส่วนตัว</option>
                    <option value="shared">แชร์ในทริป</option>
                  </select>
                </label>
                <label>
                  <span>ให้ใครดูแล</span>
                  <select value={newTaskAssigneeId} disabled={newTaskVisibility === "private"} onChange={(event) => setNewTaskAssigneeId(event.target.value)}>
                    <option value="">ยังไม่ระบุ</option>
                    {assignableMembers.map((member) => (
                      <option key={member.id} value={member.id}>{member.displayName}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="dialog-actions">
                <button className="button button--ghost" type="button" onClick={closeTaskDialog}>ยกเลิก</button>
                <button className="button button--primary" type="submit" disabled={!newTaskTitle.trim()}>เพิ่มเช็กลิสต์</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}

type OverviewRoleLens = "manager" | "traveler" | "viewer";

function overviewRoleLens(member?: Member): OverviewRoleLens {
  if (member?.role === "owner" || member?.role === "organizer") return "manager";
  if (member?.role === "traveler") return "traveler";
  return "viewer";
}

function roleHeading(roleLens: OverviewRoleLens): string {
  if (roleLens === "manager") return "คุมทริปให้พร้อม";
  if (roleLens === "traveler") return "เที่ยวอะไรต่อ";
  return "ดูภาพรวมทริป";
}

function OverviewStopList({ items, startDate }: { items: ItineraryItem[]; startDate: string }) {
  if (!items.length) return <p className="overview-muted">ยังไม่มีไฮไลต์ในแผนนี้</p>;

  return (
    <ul className="overview-stop-list">
      {items.map((item) => (
        <li key={item.id}>
          <span>{formatDayLabel(item.day, startDate)} · {item.startTime}</span>
          <strong>{item.activity}</strong>
          <small>{item.place}</small>
        </li>
      ))}
    </ul>
  );
}

function OverviewFocusList({ items, startDate }: { items: ItineraryItem[]; startDate: string }) {
  if (items.length <= 1) return null;

  return (
    <ul className="overview-focus-list" aria-label="Today focus stops">
      {items.slice(1).map((item) => (
        <li key={item.id}>
          <span>{formatDayLabel(item.day, startDate)} · {item.startTime}</span>
          <strong>{item.activity}</strong>
        </li>
      ))}
    </ul>
  );
}

function stopLabel(itemId: string, items: ItineraryItem[]): string {
  /* v8 ignore next */
  return items.find((item) => item.id === itemId)?.activity ?? "จุดในแผน";
}

function travelerNextStopDetail(item: ItineraryItem): string {
  /* v8 ignore next */
  return item.transportation || item.note || "ดูรายละเอียดในแผนการเดินทาง";
}

function viewerNextStopDetail(item: ItineraryItem): string {
  /* v8 ignore next */
  return item.transportation || "ดูรายละเอียดในแผนการเดินทาง";
}

function viewerNextStopPanel(item: ItineraryItem | undefined, startDate: string) {
  /* v8 ignore next */
  return item ? (
    <div className="overview-next-stop">
      <strong>{item.activity}</strong>
      <span>{formatDayLabel(item.day, startDate)} · {item.startTime} · {item.place}</span>
      <p>{viewerNextStopDetail(item)}</p>
    </div>
  ) : (
    <p className="overview-muted">ยังไม่มี itinerary ในแผนนี้</p>
  );
}

function managerNextStopDetail(item: ItineraryItem): string {
  /* v8 ignore next */
  return item.transportation || "ยังไม่มีข้อมูลการเดินทาง";
}

function taskKindLabel(task: TripTask): string {
  if (task.kind === "booking" || task.relatedItemId || task.title.includes("จอง")) return "การจอง";
  return "เตรียมตัว";
}

function isMyTask(task: TripTask, currentMemberId: string): boolean {
  return task.createdBy === currentMemberId || task.assigneeId === currentMemberId;
}

function assigneeLabel(task: TripTask, trip: Trip): string {
  if (task.visibility === "private") return "ของฉัน";
  if (!task.assigneeId) return "ยังไม่ระบุผู้รับผิดชอบ";
  /* v8 ignore next */
  return trip.members.find((member) => member.id === task.assigneeId)?.displayName ?? "สมาชิกในทริป";
}

function OverviewStat({ icon, label, value }: { icon: "calendar" | "location" | "users" | "wallet"; label: string; value: string }) {
  return (
    <div className="overview-stat">
      <Icon name={icon} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
