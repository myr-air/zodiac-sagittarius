import { type FormEvent, useMemo, useState } from "react";
import {
  buildPhotoAlbumSummary,
  filterPhotoAlbumLinks,
  findPhotoAlbumRelations,
  safePhotoAlbumCoverHref,
  safePhotoAlbumHref,
} from "@/src/trip/photo-albums";
import type { Member, Trip, TripPhotoAlbumAccess, TripPhotoAlbumLink, TripPhotoAlbumProvider } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { Icon } from "./icons";
import { formatTripRange, PageHeader, PageUserCard } from "./PageHeader";
import { Badge, Button, IconButton } from "./ui";

interface TripPhotosPageProps {
  trip: Trip;
  currentMember: Member;
  photoAlbumLinks: TripPhotoAlbumLink[];
  canEditPhotoAlbums: boolean;
  onCreatePhotoAlbum: (input: TripPhotoAlbumInput) => void | Promise<void>;
  onUpdatePhotoAlbum: (albumId: string, input: TripPhotoAlbumInput) => void | Promise<void>;
  onDeletePhotoAlbum: (albumId: string) => void | Promise<void>;
}

export interface TripPhotoAlbumInput {
  title: string;
  provider: TripPhotoAlbumProvider;
  url: string;
  access: TripPhotoAlbumAccess;
  ownerMemberId?: string | null;
  relatedItineraryItemIds: string[];
  day?: string | null;
  description?: string | null;
  accessNote?: string | null;
  coverUrl?: string | null;
}

const providers = ["all", "google_photos", "icloud", "google_drive", "dropbox", "onedrive", "custom"] as const;
const providerOptions = providers.filter((provider) => provider !== "all") as TripPhotoAlbumProvider[];
const accessOptions = ["view_only", "collaborative", "upload_request"] satisfies TripPhotoAlbumAccess[];

const pageClassName = "trip-photos-page grid min-h-full min-w-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3 bg-transparent px-6 py-[22px] pb-7 max-[767px]:px-3 max-[767px]:py-4";
const summaryClassName = "photos-summary grid grid-cols-4 gap-3 max-[1199px]:grid-cols-2 max-[767px]:grid-cols-1";
const statClassName = "photos-stat grid min-h-[86px] gap-1 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-3.5 shadow-[0_8px_18px_rgb(55_47_38_/_0.035)] [&_.icon]:text-(--color-primary) [&>span]:text-xs [&>span]:font-bold [&>span]:text-(--color-text-muted) [&>strong]:text-xl [&>strong]:font-black [&>strong]:text-(--color-text)";
const contentClassName = "photos-content grid min-h-0 grid-cols-[minmax(0,1fr)_330px] gap-3 max-[1199px]:grid-cols-1";
const panelClassName = "photos-panel grid min-h-0 gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3.5 shadow-[0_10px_22px_rgb(55_47_38_/_0.045)]";
const providerGridClassName = "photos-providers grid grid-cols-7 gap-2 max-[1399px]:grid-cols-4 max-[767px]:grid-cols-2";
const providerButtonClassName = "grid min-h-[76px] content-between gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-(--color-primary-border) hover:bg-(--color-surface-subtle) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)";
const selectedProviderClassName = "border-(--color-primary-border) bg-(--color-primary-soft) shadow-[0_8px_18px_rgb(194_79_22_/_0.1)]";
const cardGridClassName = "photo-album-grid grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-2";
const albumCardClassName = "photo-album-card grid min-h-[214px] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-3 text-left text-sm shadow-[0_8px_18px_rgb(15_23_42_/_0.035)] transition-[background-color,border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-(--color-primary-border) hover:bg-(--color-surface-subtle)";
const selectedAlbumClassName = "border-(--color-primary-border) bg-(--color-primary-soft) shadow-[0_10px_22px_rgb(194_79_22_/_0.09)]";
const albumCoverClassName = "photo-album-cover min-h-[74px] overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) bg-cover bg-center";
const inspectorClassName = "photos-inspector sticky top-3 grid max-h-[calc(100vh-92px)] content-start gap-3 overflow-auto rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3.5 shadow-[0_10px_22px_rgb(55_47_38_/_0.045)] max-[1199px]:static max-[1199px]:max-h-none";
const inspectorSectionClassName = "grid gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5 text-sm";
const dialogBackdropClassName = "modal-backdrop fixed inset-0 z-20 grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-4";
const dialogClassName = "photos-dialog grid max-h-[min(720px,calc(100vh_-_32px))] w-full max-w-[720px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) shadow-[0_14px_34px_rgb(15_23_42_/_0.16)]";
const dialogHeaderClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-(--color-border) px-4 py-3 [&_h2]:m-0 [&_h2]:text-lg [&_h2]:font-extrabold";
const dialogFormClassName = "grid min-h-0 gap-3 overflow-y-auto p-4";
const dialogGridClassName = "grid grid-cols-2 gap-3 max-[767px]:grid-cols-1";
const fieldClassName = "grid min-w-0 gap-1.5 [&>span]:text-[11px] [&>span]:font-extrabold [&>span]:text-(--color-text-muted) [&_input]:min-h-10 [&_input]:rounded-(--radius-md) [&_input]:border [&_input]:border-(--color-border) [&_input]:bg-(--color-surface) [&_input]:px-3 [&_input]:text-sm [&_select]:min-h-10 [&_select]:rounded-(--radius-md) [&_select]:border [&_select]:border-(--color-border) [&_select]:bg-(--color-surface) [&_select]:px-3 [&_select]:text-sm [&_textarea]:min-h-[74px] [&_textarea]:resize-y [&_textarea]:rounded-(--radius-md) [&_textarea]:border [&_textarea]:border-(--color-border) [&_textarea]:bg-(--color-surface) [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm";
const dialogActionsClassName = "flex flex-wrap items-center justify-end gap-2 border-t border-(--color-border) pt-3";
const deleteDialogClassName = "delete-confirm-dialog grid w-[min(420px,100%)] gap-3 rounded-(--radius-lg) border border-(--color-danger-border) bg-(--color-surface) p-4 shadow-[0_14px_34px_rgb(15_23_42_/_0.14)]";
const photoCopy = {
  en: {
    pageLabel: "Photos & Albums",
    title: "Photos & Albums",
    albumLinks: (count: number) => `${count} album links`,
    canAddAlbums: "Can add albums",
    readOnly: "Read-only",
    summaryLabel: "Photo album summary",
    savedDestinations: "Saved destinations",
    albums: (count: number) => `${count} albums`,
    sharedUploads: "Shared uploads",
    collaborative: (count: number) => `${count} collaborative`,
    uploadRequests: "Upload requests",
    requests: (count: number) => `${count} requests`,
    needsAccessNote: "Needs access note",
    missing: (count: number) => `${count} missing`,
    providersLabel: "Photo providers",
    providerCount: (label: string, count: number) => `${label}, ${count} albums`,
    providerHint: (count: number) => `Photos stay with the linked provider · ${count} visible albums`,
    addAlbum: "Add album",
    albumLinksLabel: "Photo album links",
    emptyTitle: "No albums in this view",
    emptyDetail: "Add a Google Photos album, Drive folder, Dropbox request, or another shared photo destination.",
    deleteAlbum: "Delete album",
    deletePrompt: (title: string) => `Delete ${title}? The external provider album will stay in place.`,
    cancel: "Cancel",
    selectAlbum: (title: string) => `Select ${title}`,
    coverFor: (title: string) => `Cover for ${title}`,
    defaultAccessNote: "Add access note so the group knows how to use this album.",
    noOwner: "No owner",
    tripLevel: "Trip-level",
    unsafeLinkBlocked: "Unsafe link blocked",
    openAlbumTitle: (title: string) => `Open ${title}`,
    openBlocked: "Open blocked",
    editAlbum: "Edit album",
    inspectorLabel: "Photo album inspector",
    selectHint: "Select an album to see access details.",
    externalProviderNote: "External provider permissions control real access.",
    blockedLink: "Blocked link",
    copy: "Copy",
    openAlbum: "Open album",
    access: "Access",
    noAccessNote: "No access note yet.",
    owner: "Owner",
    noOwnerAssigned: "No owner assigned",
    createdBy: (name: string) => `Created by ${name}`,
    relatedStops: "Related stops",
    addAlbumDialog: "Add album",
    editAlbumDialog: "Edit album",
    close: "Close",
    titleField: "Title",
    providerField: "Provider",
    accessField: "Access",
    ownerField: "Owner",
    albumLinkField: "Album link",
    dayField: "Day",
    descriptionField: "Description",
    accessNoteField: "Access note",
    relatedItinerary: "Related itinerary",
    saveAlbum: "Save album",
    providers: {
      all: "All albums",
      google_photos: "Google Photos",
      icloud: "iCloud",
      google_drive: "Google Drive",
      dropbox: "Dropbox",
      onedrive: "OneDrive",
      custom: "Custom",
    },
    accessLabels: {
      view_only: "View only",
      collaborative: "Collaborative",
      upload_request: "Upload request",
    },
  },
  th: {
    pageLabel: "รูปภาพและอัลบั้ม",
    title: "รูปภาพและอัลบั้ม",
    albumLinks: (count: number) => `${count} ลิงก์อัลบั้ม`,
    canAddAlbums: "เพิ่มอัลบั้มได้",
    readOnly: "อ่านอย่างเดียว",
    summaryLabel: "สรุปอัลบั้มรูปภาพ",
    savedDestinations: "ปลายทางที่บันทึกไว้",
    albums: (count: number) => `${count} อัลบั้ม`,
    sharedUploads: "อัปโหลดร่วมกัน",
    collaborative: (count: number) => `${count} อัลบั้มร่วม`,
    uploadRequests: "คำขออัปโหลด",
    requests: (count: number) => `${count} คำขอ`,
    needsAccessNote: "ต้องมีโน้ตการเข้าถึง",
    missing: (count: number) => `ขาด ${count} รายการ`,
    providersLabel: "ผู้ให้บริการรูปภาพ",
    providerCount: (label: string, count: number) => `${label}, ${count} อัลบั้ม`,
    providerHint: (count: number) => `รูปภาพยังอยู่กับผู้ให้บริการที่ลิงก์ไว้ · แสดง ${count} อัลบั้ม`,
    addAlbum: "เพิ่มอัลบั้ม",
    albumLinksLabel: "ลิงก์อัลบั้มรูปภาพ",
    emptyTitle: "ไม่มีอัลบั้มในมุมมองนี้",
    emptyDetail: "เพิ่ม Google Photos, โฟลเดอร์ Drive, คำขอ Dropbox หรือปลายทางรูปภาพอื่นที่แชร์ได้",
    deleteAlbum: "ลบอัลบั้ม",
    deletePrompt: (title: string) => `ลบ ${title}? อัลบั้มภายนอกจะยังอยู่ที่ผู้ให้บริการเดิม`,
    cancel: "ยกเลิก",
    selectAlbum: (title: string) => `เลือก ${title}`,
    coverFor: (title: string) => `ภาพปกของ ${title}`,
    defaultAccessNote: "เพิ่มโน้ตการเข้าถึงเพื่อให้กลุ่มรู้วิธีใช้อัลบั้มนี้",
    noOwner: "ยังไม่มีเจ้าของ",
    tripLevel: "ระดับทริป",
    unsafeLinkBlocked: "บล็อกลิงก์ที่ไม่ปลอดภัย",
    openAlbumTitle: (title: string) => `เปิด ${title}`,
    openBlocked: "เปิดไม่ได้",
    editAlbum: "แก้ไขอัลบั้ม",
    inspectorLabel: "รายละเอียดอัลบั้มรูปภาพ",
    selectHint: "เลือกอัลบั้มเพื่อดูรายละเอียดการเข้าถึง",
    externalProviderNote: "สิทธิ์จริงถูกควบคุมโดยผู้ให้บริการภายนอก",
    blockedLink: "ลิงก์ถูกบล็อก",
    copy: "คัดลอก",
    openAlbum: "เปิดอัลบั้ม",
    access: "การเข้าถึง",
    noAccessNote: "ยังไม่มีโน้ตการเข้าถึง",
    owner: "เจ้าของ",
    noOwnerAssigned: "ยังไม่ได้กำหนดเจ้าของ",
    createdBy: (name: string) => `สร้างโดย ${name}`,
    relatedStops: "จุดที่เกี่ยวข้อง",
    addAlbumDialog: "เพิ่มอัลบั้ม",
    editAlbumDialog: "แก้ไขอัลบั้ม",
    close: "ปิด",
    titleField: "ชื่อ",
    providerField: "ผู้ให้บริการ",
    accessField: "การเข้าถึง",
    ownerField: "เจ้าของ",
    albumLinkField: "ลิงก์อัลบั้ม",
    dayField: "วัน",
    descriptionField: "คำอธิบาย",
    accessNoteField: "โน้ตการเข้าถึง",
    relatedItinerary: "แผนการเดินทางที่เกี่ยวข้อง",
    saveAlbum: "บันทึกอัลบั้ม",
    providers: {
      all: "ทุกอัลบั้ม",
      google_photos: "Google Photos",
      icloud: "iCloud",
      google_drive: "Google Drive",
      dropbox: "Dropbox",
      onedrive: "OneDrive",
      custom: "กำหนดเอง",
    },
    accessLabels: {
      view_only: "ดูอย่างเดียว",
      collaborative: "ร่วมแก้ไขได้",
      upload_request: "คำขออัปโหลด",
    },
  },
} as const;

export function TripPhotosPage({
  trip,
  currentMember,
  photoAlbumLinks,
  canEditPhotoAlbums,
  onCreatePhotoAlbum,
  onUpdatePhotoAlbum,
  onDeletePhotoAlbum,
}: TripPhotosPageProps) {
  const { locale } = useI18n();
  const copy = photoCopy[locale];
  const [activeProvider, setActiveProvider] = useState<(typeof providers)[number]>("all");
  const [selectedAlbumId, setSelectedAlbumId] = useState(photoAlbumLinks[0]?.id ?? "");
  const [dialogAlbum, setDialogAlbum] = useState<TripPhotoAlbumLink | "new" | null>(null);
  const [deleteAlbum, setDeleteAlbum] = useState<TripPhotoAlbumLink | null>(null);
  const summary = useMemo(() => buildPhotoAlbumSummary(photoAlbumLinks), [photoAlbumLinks]);
  const providerCounts = useMemo(() => countProviders(photoAlbumLinks), [photoAlbumLinks]);
  const visibleAlbums = useMemo(() => filterPhotoAlbumLinks(photoAlbumLinks, { provider: activeProvider }), [activeProvider, photoAlbumLinks]);
  const selectedAlbum = visibleAlbums.find((album) => album.id === selectedAlbumId) ?? visibleAlbums[0] ?? null;
  const selectedRelations = selectedAlbum ? findPhotoAlbumRelations(selectedAlbum, trip) : null;

  async function submitAlbum(input: TripPhotoAlbumInput) {
    if (dialogAlbum === "new") {
      await onCreatePhotoAlbum(input);
    } else if (dialogAlbum) {
      await onUpdatePhotoAlbum(dialogAlbum.id, input);
    }
    setDialogAlbum(null);
  }

  async function confirmDelete() {
    if (!deleteAlbum) return;
    await onDeletePhotoAlbum(deleteAlbum.id);
    setDeleteAlbum(null);
  }

  return (
    <section className={pageClassName} aria-label={copy.pageLabel} role="region">
      <PageHeader
        title={copy.title}
        subtitle={trip.name}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(trip.startDate, trip.endDate, locale)}</span>
            <span><Icon name="cloud" /> {copy.albumLinks(photoAlbumLinks.length)}</span>
          </>
        )}
        aside={<PageUserCard color={currentMember.color} name={currentMember.displayName} label={canEditPhotoAlbums ? copy.canAddAlbums : copy.readOnly} />}
      />

      <div className={summaryClassName} aria-label={copy.summaryLabel}>
        <SummaryStat icon="cloud" label={copy.savedDestinations} value={copy.albums(summary.total)} />
        <SummaryStat icon="users" label={copy.sharedUploads} value={copy.collaborative(summary.collaborative)} />
        <SummaryStat icon="import" label={copy.uploadRequests} value={copy.requests(summary.uploadRequests)} />
        <SummaryStat icon="warning" label={copy.needsAccessNote} value={copy.missing(summary.missingAccessNotes)} />
      </div>

      <div className={contentClassName}>
        <div className={panelClassName}>
          <div className={providerGridClassName} aria-label={copy.providersLabel}>
            {providers.map((provider) => (
              <button
                key={provider}
                type="button"
                className={cn(providerButtonClassName, activeProvider === provider && selectedProviderClassName)}
                onClick={() => setActiveProvider(provider)}
                aria-pressed={activeProvider === provider}
                aria-label={copy.providerCount(providerLabel(provider, copy), providerCounts[provider] ?? 0)}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="grid size-9 place-items-center rounded-(--radius-md) border border-(--color-primary-border) bg-(--color-surface-subtle) text-(--color-primary-strong)">
                    <Icon name={provider === "all" ? "layout" : provider === "dropbox" ? "import" : "cloud"} />
                  </span>
                  <strong className="tabular-nums text-sm text-(--color-text)">{providerCounts[provider] ?? 0}</strong>
                </span>
                <strong className="text-sm font-extrabold text-(--color-text)">{providerLabel(provider, copy)}</strong>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="grid gap-0.5">
              <strong className="text-[15px] font-extrabold text-(--color-text)">{providerLabel(activeProvider, copy)}</strong>
              <span className="text-xs font-semibold text-(--color-text-muted)">{copy.providerHint(visibleAlbums.length)}</span>
            </div>
            {canEditPhotoAlbums ? <Button type="button" onClick={() => setDialogAlbum("new")}><Icon name="plus" /> {copy.addAlbum}</Button> : null}
          </div>

          <div className={cardGridClassName} aria-label={copy.albumLinksLabel}>
            {visibleAlbums.map((album) => (
              <PhotoAlbumCard
                key={album.id}
                album={album}
                trip={trip}
                selected={selectedAlbum?.id === album.id}
                canEdit={canEditPhotoAlbums}
                onSelect={() => setSelectedAlbumId(album.id)}
                onEdit={() => setDialogAlbum(album)}
                onDelete={() => setDeleteAlbum(album)}
                copy={copy}
              />
            ))}
            {!visibleAlbums.length ? (
              <div className="col-span-full grid min-h-[160px] place-items-center rounded-(--radius-md) border border-dashed border-(--color-border-strong) bg-(--color-surface-subtle) p-5 text-center">
                <div className="grid max-w-[360px] gap-1">
                  <strong className="text-(--color-text)">{copy.emptyTitle}</strong>
                  <span className="text-sm font-medium leading-6 text-(--color-text-muted)">{copy.emptyDetail}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <PhotoAlbumInspector album={selectedAlbum} relations={selectedRelations} trip={trip} copy={copy} />
      </div>

      {dialogAlbum ? (
        <PhotoAlbumDialog
          album={dialogAlbum === "new" ? null : dialogAlbum}
          currentMember={currentMember}
          trip={trip}
          onCancel={() => setDialogAlbum(null)}
          onSubmit={submitAlbum}
          copy={copy}
        />
      ) : null}

      {deleteAlbum ? (
        <div className={dialogBackdropClassName}>
          <div className={deleteDialogClassName} role="dialog" aria-modal="true" aria-label={copy.deleteAlbum}>
            <h2 className="m-0 text-lg font-extrabold text-(--color-text)">{copy.deleteAlbum}</h2>
            <p className="m-0 text-sm font-medium leading-6 text-(--color-text-muted)">{copy.deletePrompt(deleteAlbum.title)}</p>
            <div className={dialogActionsClassName}>
              <Button type="button" variant="ghost" onClick={() => setDeleteAlbum(null)}>{copy.cancel}</Button>
              <Button type="button" variant="danger" onClick={() => void confirmDelete()}>{copy.deleteAlbum}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SummaryStat({ icon, label, value }: { icon: Parameters<typeof Icon>[0]["name"]; label: string; value: string }) {
  return (
    <div className={statClassName}>
      <Icon name={icon} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PhotoAlbumCard({
  album,
  copy,
  trip,
  selected,
  canEdit,
  onSelect,
  onEdit,
  onDelete,
}: {
  album: TripPhotoAlbumLink;
  copy: typeof photoCopy.en | typeof photoCopy.th;
  trip: Trip;
  selected: boolean;
  canEdit: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const href = safePhotoAlbumHref(album.url);
  const owner = trip.members.find((member) => member.id === album.ownerMemberId);
  const coverHref = safePhotoAlbumCoverHref(album.coverUrl);
  return (
    <article className={cn(albumCardClassName, selected && selectedAlbumClassName)}>
      <button type="button" className="grid min-w-0 gap-2 text-left" onClick={onSelect} aria-label={copy.selectAlbum(album.title)}>
        <span
          aria-label={copy.coverFor(album.title)}
          className={albumCoverClassName}
          role="img"
          style={coverHref ? { backgroundImage: `url(${coverHref})` } : undefined}
        />
        <span className="flex items-center justify-between gap-2">
          <Badge tone={album.access === "collaborative" ? "primary" : album.access === "upload_request" ? "warning" : "route"}>{accessLabel(album.access, copy)}</Badge>
          <span className="text-xs font-extrabold text-(--color-text-muted)">{providerLabel(album.provider, copy)}</span>
        </span>
        <span className="grid gap-1">
          <strong className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-black text-(--color-text)">{album.title}</strong>
          <span className="line-clamp-2 text-xs font-semibold leading-5 text-(--color-text-muted)">{album.accessNote || album.description || copy.defaultAccessNote}</span>
        </span>
      </button>
      <div className="grid gap-2 text-xs font-bold text-(--color-text-muted)">
        <span className="flex min-w-0 items-center gap-1.5"><Icon name="users" /> {owner?.displayName ?? copy.noOwner}</span>
        <span className="flex min-w-0 items-center gap-1.5"><Icon name="calendar" /> {album.day ?? copy.tripLevel}</span>
        {!href ? <span className="font-extrabold text-[#b91c1c]">{copy.unsafeLinkBlocked}</span> : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {href ? (
          <Button asChild variant="ghost" className="w-auto">
            <a href={href} target="_blank" rel="noreferrer">{copy.openAlbumTitle(album.title)}<Icon name="external" /></a>
          </Button>
        ) : (
          <Button type="button" variant="ghost" className="w-auto" disabled>{copy.openBlocked}</Button>
        )}
        {canEdit ? (
          <span className="flex gap-1">
            <IconButton type="button" aria-label={copy.editAlbum} onClick={onEdit}><Icon name="edit" /></IconButton>
            <IconButton type="button" aria-label={copy.deleteAlbum} onClick={onDelete}><Icon name="trash" /></IconButton>
          </span>
        ) : null}
      </div>
    </article>
  );
}

function PhotoAlbumInspector({
  album,
  copy,
  relations,
  trip,
}: {
  album: TripPhotoAlbumLink | null;
  copy: typeof photoCopy.en | typeof photoCopy.th;
  relations: ReturnType<typeof findPhotoAlbumRelations> | null;
  trip: Trip;
}) {
  if (!album) {
    return (
      <section className={inspectorClassName} aria-label={copy.inspectorLabel}>
        <div className={inspectorSectionClassName}>{copy.selectHint}</div>
      </section>
    );
  }
  const href = safePhotoAlbumHref(album.url);
  const createdBy = trip.members.find((member) => member.id === album.createdBy);
  const linkHost = albumLinkHost(href);
  return (
    <section className={inspectorClassName} aria-label={copy.inspectorLabel}>
      <div className="grid gap-2">
        <Badge tone={album.access === "collaborative" ? "primary" : album.access === "upload_request" ? "warning" : "route"}>{providerLabel(album.provider, copy)}</Badge>
        <h2 className="m-0 text-xl font-black text-(--color-text)">{album.title}</h2>
        <span className="text-sm font-semibold leading-6 text-(--color-text-muted)">{copy.externalProviderNote}</span>
      </div>
      <div className={inspectorSectionClassName}>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="min-w-0 truncate text-xs font-black text-(--color-text-muted)">{linkHost ?? copy.blockedLink}</span>
          {href ? (
            <button
              type="button"
              className="inline-flex min-h-8 items-center gap-1.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2 text-xs font-extrabold text-(--color-primary-strong)"
              onClick={() => void navigator.clipboard?.writeText(album.url)}
            >
              <Icon name="copy" /> {copy.copy}
            </button>
          ) : null}
        </div>
        {href ? (
          <Button asChild className="w-full">
            <a href={href} target="_blank" rel="noreferrer">{copy.openAlbum}<Icon name="external" /></a>
          </Button>
        ) : (
          <strong className="text-[#b91c1c]">{copy.unsafeLinkBlocked}</strong>
        )}
      </div>
      <div className={inspectorSectionClassName}>
        <strong className="text-(--color-text)">{copy.access}</strong>
        <span>{accessLabel(album.access, copy)}</span>
        <span className="text-(--color-text-muted)">{album.accessNote || copy.noAccessNote}</span>
      </div>
      <div className={inspectorSectionClassName}>
        <strong className="text-(--color-text)">{copy.owner}</strong>
        <span>{relations?.owner?.displayName ?? copy.noOwnerAssigned}</span>
        <span className="text-xs text-(--color-text-muted)">{copy.createdBy(createdBy?.displayName ?? album.createdBy)}</span>
      </div>
      <div className={inspectorSectionClassName}>
        <strong className="text-(--color-text)">{copy.relatedStops}</strong>
        {relations?.itineraryItems.length ? relations.itineraryItems.map((item) => (
          <span key={item.id} className="text-sm">{item.day} · {item.activity}</span>
        )) : <span className="text-(--color-text-muted)">{copy.tripLevel}</span>}
      </div>
    </section>
  );
}

function albumLinkHost(href: string | null): string | null {
  if (!href) return null;
  try {
    return new URL(href).host;
  } catch {
    return null;
  }
}

function PhotoAlbumDialog({
  album,
  copy,
  currentMember,
  trip,
  onCancel,
  onSubmit,
}: {
  album: TripPhotoAlbumLink | null;
  copy: typeof photoCopy.en | typeof photoCopy.th;
  currentMember: Member;
  trip: Trip;
  onCancel: () => void;
  onSubmit: (input: TripPhotoAlbumInput) => void | Promise<void>;
}) {
  const [title, setTitle] = useState(album?.title ?? "");
  const [provider, setProvider] = useState<TripPhotoAlbumProvider>(album?.provider ?? "google_photos");
  const [access, setAccess] = useState<TripPhotoAlbumAccess>(album?.access ?? "collaborative");
  const [url, setUrl] = useState(album?.url ?? "");
  const [ownerMemberId, setOwnerMemberId] = useState(album?.ownerMemberId ?? currentMember.id);
  const [day, setDay] = useState(album?.day ?? "");
  const [description, setDescription] = useState(album?.description ?? "");
  const [accessNote, setAccessNote] = useState(album?.accessNote ?? "");
  const [relatedItineraryItemIds, setRelatedItineraryItemIds] = useState(album?.relatedItineraryItemIds ?? []);
  const days = Array.from(new Set(trip.itineraryItems.map((item) => item.day))).sort();

  function toggleRelatedItem(itemId: string) {
    setRelatedItineraryItemIds((current) => current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      title: title.trim(),
      provider,
      url: url.trim(),
      access,
      ownerMemberId: ownerMemberId || null,
      relatedItineraryItemIds,
      day: day || null,
      description: description.trim() || null,
      accessNote: accessNote.trim() || null,
      coverUrl: album?.coverUrl ?? null,
    });
  }

  return (
    <div className={dialogBackdropClassName}>
      <div className={dialogClassName} role="dialog" aria-modal="true" aria-label={album ? copy.editAlbumDialog : copy.addAlbumDialog}>
        <div className={dialogHeaderClassName}>
          <h2>{album ? copy.editAlbumDialog : copy.addAlbumDialog}</h2>
          <IconButton type="button" aria-label={copy.close} onClick={onCancel}><Icon name="x" /></IconButton>
        </div>
        <form className={dialogFormClassName} onSubmit={(event) => void handleSubmit(event)}>
          <div className={dialogGridClassName}>
            <label className={fieldClassName}>
              <span>{copy.titleField}</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>
            <label className={fieldClassName}>
              <span>{copy.providerField}</span>
              <select value={provider} onChange={(event) => setProvider(event.target.value as TripPhotoAlbumProvider)}>
                {providerOptions.map((option) => <option key={option} value={option}>{providerLabel(option, copy)}</option>)}
              </select>
            </label>
            <label className={fieldClassName}>
              <span>{copy.accessField}</span>
              <select value={access} onChange={(event) => setAccess(event.target.value as TripPhotoAlbumAccess)}>
                {accessOptions.map((option) => <option key={option} value={option}>{accessLabel(option, copy)}</option>)}
              </select>
            </label>
            <label className={fieldClassName}>
              <span>{copy.ownerField}</span>
              <select value={ownerMemberId} onChange={(event) => setOwnerMemberId(event.target.value)}>
                <option value="">{copy.noOwner}</option>
                {trip.members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
              </select>
            </label>
            <label className={fieldClassName}>
              <span>{copy.albumLinkField}</span>
              <input value={url} onChange={(event) => setUrl(event.target.value)} required />
            </label>
            <label className={fieldClassName}>
              <span>{copy.dayField}</span>
              <select value={day} onChange={(event) => setDay(event.target.value)}>
                <option value="">{copy.tripLevel}</option>
                {days.map((candidate) => <option key={candidate} value={candidate}>{candidate}</option>)}
              </select>
            </label>
            <label className={fieldClassName}>
              <span>{copy.descriptionField}</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <label className={fieldClassName}>
              <span>{copy.accessNoteField}</span>
              <textarea value={accessNote} onChange={(event) => setAccessNote(event.target.value)} />
            </label>
          </div>
          <fieldset className="grid gap-2 rounded-(--radius-md) border border-(--color-border) p-3">
            <legend className="px-1 text-xs font-extrabold text-(--color-text-muted)">{copy.relatedItinerary}</legend>
            <div className="grid max-h-48 gap-2 overflow-auto">
              {trip.itineraryItems.map((item) => (
                <label key={item.id} className="flex items-start gap-2 text-sm font-semibold text-(--color-text-muted)">
                  <input type="checkbox" checked={relatedItineraryItemIds.includes(item.id)} onChange={() => toggleRelatedItem(item.id)} />
                  <span>{item.day} · {item.activity}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className={dialogActionsClassName}>
            <Button type="button" variant="ghost" onClick={onCancel}>{copy.cancel}</Button>
            <Button type="submit">{copy.saveAlbum}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function countProviders(albums: TripPhotoAlbumLink[]): Record<(typeof providers)[number], number> {
  return {
    all: albums.length,
    google_photos: albums.filter((album) => album.provider === "google_photos").length,
    icloud: albums.filter((album) => album.provider === "icloud").length,
    google_drive: albums.filter((album) => album.provider === "google_drive").length,
    dropbox: albums.filter((album) => album.provider === "dropbox").length,
    onedrive: albums.filter((album) => album.provider === "onedrive").length,
    custom: albums.filter((album) => album.provider === "custom").length,
  };
}

function providerLabel(provider: TripPhotoAlbumProvider | "all", copy: typeof photoCopy.en | typeof photoCopy.th): string {
  return copy.providers[provider];
}

function accessLabel(access: TripPhotoAlbumAccess, copy: typeof photoCopy.en | typeof photoCopy.th): string {
  return copy.accessLabels[access];
}
