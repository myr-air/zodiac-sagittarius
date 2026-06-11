import { type FormEvent, useMemo, useState } from "react";
import {
  buildPhotoAlbumSummary,
  filterPhotoAlbumLinks,
  findPhotoAlbumRelations,
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
const providerButtonClassName = "grid min-h-[76px] content-between gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-(--color-primary-border) hover:bg-[#fbfffd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)";
const selectedProviderClassName = "border-(--color-primary-border) bg-(--color-primary-soft) shadow-[0_8px_18px_rgb(15_118_110_/_0.1)]";
const cardGridClassName = "photo-album-grid grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-2";
const albumCardClassName = "photo-album-card grid min-h-[214px] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-3 text-left text-sm shadow-[0_8px_18px_rgb(15_23_42_/_0.035)] transition-[background-color,border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-(--color-primary-border) hover:bg-[#fbfefd]";
const selectedAlbumClassName = "border-(--color-primary-border) bg-(--color-primary-soft) shadow-[0_10px_22px_rgb(15_118_110_/_0.09)]";
const albumCoverClassName = "photo-album-cover min-h-[74px] overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-[linear-gradient(135deg,rgb(236_254_255),rgb(255_247_237)_54%,rgb(239_246_255))] bg-cover bg-center";
const inspectorClassName = "photos-inspector sticky top-3 grid max-h-[calc(100vh-92px)] content-start gap-3 overflow-auto rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3.5 shadow-[0_10px_22px_rgb(55_47_38_/_0.045)] max-[1199px]:static max-[1199px]:max-h-none";
const inspectorSectionClassName = "grid gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5 text-sm";
const dialogBackdropClassName = "modal-backdrop fixed inset-0 z-20 grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-4";
const dialogClassName = "photos-dialog grid max-h-[min(720px,calc(100vh_-_32px))] w-full max-w-[720px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) shadow-[0_24px_70px_rgb(15_23_42_/_0.28)]";
const dialogHeaderClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-(--color-border) px-4 py-3 [&_h2]:m-0 [&_h2]:text-lg [&_h2]:font-extrabold";
const dialogFormClassName = "grid min-h-0 gap-3 overflow-y-auto p-4";
const dialogGridClassName = "grid grid-cols-2 gap-3 max-[767px]:grid-cols-1";
const fieldClassName = "grid min-w-0 gap-1.5 [&>span]:text-[11px] [&>span]:font-extrabold [&>span]:text-(--color-text-muted) [&_input]:min-h-10 [&_input]:rounded-(--radius-md) [&_input]:border [&_input]:border-(--color-border) [&_input]:bg-(--color-surface) [&_input]:px-3 [&_input]:text-sm [&_select]:min-h-10 [&_select]:rounded-(--radius-md) [&_select]:border [&_select]:border-(--color-border) [&_select]:bg-(--color-surface) [&_select]:px-3 [&_select]:text-sm [&_textarea]:min-h-[74px] [&_textarea]:resize-y [&_textarea]:rounded-(--radius-md) [&_textarea]:border [&_textarea]:border-(--color-border) [&_textarea]:bg-(--color-surface) [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm";
const dialogActionsClassName = "flex flex-wrap items-center justify-end gap-2 border-t border-(--color-border) pt-3";
const deleteDialogClassName = "delete-confirm-dialog grid w-[min(420px,100%)] gap-3 rounded-(--radius-lg) border border-(--color-danger-border) bg-(--color-surface) p-4 shadow-[0_24px_70px_rgb(15_23_42_/_0.22)]";

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
    <section className={pageClassName} aria-label="Photos & Albums" role="region">
      <PageHeader
        title="Photos & Albums"
        subtitle={trip.name}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(trip.startDate, trip.endDate, locale)}</span>
            <span><Icon name="cloud" /> {photoAlbumLinks.length} album links</span>
          </>
        )}
        aside={<PageUserCard color={currentMember.color} name={currentMember.displayName} label={canEditPhotoAlbums ? "Can add albums" : "Read-only"} />}
      />

      <div className={summaryClassName} aria-label="Photo album summary">
        <SummaryStat icon="cloud" label="Saved destinations" value={`${summary.total} albums`} />
        <SummaryStat icon="users" label="Shared uploads" value={`${summary.collaborative} collaborative`} />
        <SummaryStat icon="import" label="Upload requests" value={`${summary.uploadRequests} requests`} />
        <SummaryStat icon="warning" label="Needs access note" value={`${summary.missingAccessNotes} missing`} />
      </div>

      <div className={contentClassName}>
        <div className={panelClassName}>
          <div className={providerGridClassName} aria-label="Photo providers">
            {providers.map((provider) => (
              <button
                key={provider}
                type="button"
                className={cn(providerButtonClassName, activeProvider === provider && selectedProviderClassName)}
                onClick={() => setActiveProvider(provider)}
                aria-pressed={activeProvider === provider}
                aria-label={`${providerLabel(provider)}, ${providerCounts[provider] ?? 0} albums`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="grid size-9 place-items-center rounded-(--radius-md) border border-[rgb(15_118_110_/_0.12)] bg-(--color-surface-subtle) text-(--color-primary-strong)">
                    <Icon name={provider === "all" ? "layout" : provider === "dropbox" ? "import" : "cloud"} />
                  </span>
                  <strong className="tabular-nums text-sm text-(--color-text)">{providerCounts[provider] ?? 0}</strong>
                </span>
                <strong className="text-sm font-extrabold text-(--color-text)">{providerLabel(provider)}</strong>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="grid gap-0.5">
              <strong className="text-[15px] font-extrabold text-(--color-text)">{providerLabel(activeProvider)}</strong>
              <span className="text-xs font-semibold text-(--color-text-muted)">Photos stay with the linked provider · {visibleAlbums.length} visible albums</span>
            </div>
            {canEditPhotoAlbums ? <Button type="button" onClick={() => setDialogAlbum("new")}><Icon name="plus" /> Add album</Button> : null}
          </div>

          <div className={cardGridClassName} aria-label="Photo album links">
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
              />
            ))}
            {!visibleAlbums.length ? (
              <div className="col-span-full grid min-h-[160px] place-items-center rounded-(--radius-md) border border-dashed border-(--color-border-strong) bg-(--color-surface-subtle) p-5 text-center">
                <div className="grid max-w-[360px] gap-1">
                  <strong className="text-(--color-text)">No albums in this view</strong>
                  <span className="text-sm font-medium leading-6 text-(--color-text-muted)">Add a Google Photos album, Drive folder, Dropbox request, or another shared photo destination.</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <PhotoAlbumInspector album={selectedAlbum} relations={selectedRelations} trip={trip} />
      </div>

      {dialogAlbum ? (
        <PhotoAlbumDialog
          album={dialogAlbum === "new" ? null : dialogAlbum}
          currentMember={currentMember}
          trip={trip}
          onCancel={() => setDialogAlbum(null)}
          onSubmit={submitAlbum}
        />
      ) : null}

      {deleteAlbum ? (
        <div className={dialogBackdropClassName}>
          <div className={deleteDialogClassName} role="dialog" aria-modal="true" aria-label="Delete album">
            <h2 className="m-0 text-lg font-extrabold text-(--color-text)">Delete album</h2>
            <p className="m-0 text-sm font-medium leading-6 text-(--color-text-muted)">Delete {deleteAlbum.title}? The external provider album will stay in place.</p>
            <div className={dialogActionsClassName}>
              <Button type="button" variant="ghost" onClick={() => setDeleteAlbum(null)}>Cancel</Button>
              <Button type="button" variant="danger" onClick={() => void confirmDelete()}>Delete album</Button>
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
  trip,
  selected,
  canEdit,
  onSelect,
  onEdit,
  onDelete,
}: {
  album: TripPhotoAlbumLink;
  trip: Trip;
  selected: boolean;
  canEdit: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const href = safePhotoAlbumHref(album.url);
  const owner = trip.members.find((member) => member.id === album.ownerMemberId);
  const coverHref = safePhotoAlbumHref(album.coverUrl);
  return (
    <article className={cn(albumCardClassName, selected && selectedAlbumClassName)}>
      <button type="button" className="grid min-w-0 gap-2 text-left" onClick={onSelect} aria-label={`Select ${album.title}`}>
        <span
          aria-label={`Cover for ${album.title}`}
          className={albumCoverClassName}
          role="img"
          style={coverHref ? { backgroundImage: `url(${coverHref})` } : undefined}
        />
        <span className="flex items-center justify-between gap-2">
          <Badge tone={album.access === "collaborative" ? "primary" : album.access === "upload_request" ? "warning" : "route"}>{accessLabel(album.access)}</Badge>
          <span className="text-xs font-extrabold text-(--color-text-muted)">{providerLabel(album.provider)}</span>
        </span>
        <span className="grid gap-1">
          <strong className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-black text-(--color-text)">{album.title}</strong>
          <span className="line-clamp-2 text-xs font-semibold leading-5 text-(--color-text-muted)">{album.accessNote || album.description || "Add access note so the group knows how to use this album."}</span>
        </span>
      </button>
      <div className="grid gap-2 text-xs font-bold text-(--color-text-muted)">
        <span className="flex min-w-0 items-center gap-1.5"><Icon name="users" /> {owner?.displayName ?? "No owner"}</span>
        <span className="flex min-w-0 items-center gap-1.5"><Icon name="calendar" /> {album.day ?? "Trip-level"}</span>
        {!href ? <span className="font-extrabold text-[#b91c1c]">Unsafe link blocked</span> : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {href ? (
          <Button asChild variant="ghost" className="w-auto">
            <a href={href} target="_blank" rel="noreferrer">Open {album.title}<Icon name="external" /></a>
          </Button>
        ) : (
          <Button type="button" variant="ghost" className="w-auto" disabled>Open blocked</Button>
        )}
        {canEdit ? (
          <span className="flex gap-1">
            <IconButton type="button" aria-label="Edit album" onClick={onEdit}><Icon name="edit" /></IconButton>
            <IconButton type="button" aria-label="Delete album" onClick={onDelete}><Icon name="trash" /></IconButton>
          </span>
        ) : null}
      </div>
    </article>
  );
}

function PhotoAlbumInspector({
  album,
  relations,
  trip,
}: {
  album: TripPhotoAlbumLink | null;
  relations: ReturnType<typeof findPhotoAlbumRelations> | null;
  trip: Trip;
}) {
  if (!album) {
    return (
      <section className={inspectorClassName} aria-label="Photo album inspector">
        <div className={inspectorSectionClassName}>Select an album to see access details.</div>
      </section>
    );
  }
  const href = safePhotoAlbumHref(album.url);
  const createdBy = trip.members.find((member) => member.id === album.createdBy);
  const linkHost = albumLinkHost(href);
  return (
    <section className={inspectorClassName} aria-label="Photo album inspector">
      <div className="grid gap-2">
        <Badge tone={album.access === "collaborative" ? "primary" : album.access === "upload_request" ? "warning" : "route"}>{providerLabel(album.provider)}</Badge>
        <h2 className="m-0 text-xl font-black text-(--color-text)">{album.title}</h2>
        <span className="text-sm font-semibold leading-6 text-(--color-text-muted)">External provider permissions control real access.</span>
      </div>
      <div className={inspectorSectionClassName}>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="min-w-0 truncate text-xs font-black text-(--color-text-muted)">{linkHost ?? "Blocked link"}</span>
          {href ? (
            <button
              type="button"
              className="inline-flex min-h-8 items-center gap-1.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2 text-xs font-extrabold text-(--color-primary-strong)"
              onClick={() => void navigator.clipboard?.writeText(album.url)}
            >
              <Icon name="copy" /> Copy
            </button>
          ) : null}
        </div>
        {href ? (
          <Button asChild className="w-full">
            <a href={href} target="_blank" rel="noreferrer">Open album<Icon name="external" /></a>
          </Button>
        ) : (
          <strong className="text-[#b91c1c]">Unsafe link blocked</strong>
        )}
      </div>
      <div className={inspectorSectionClassName}>
        <strong className="text-(--color-text)">Access</strong>
        <span>{accessLabel(album.access)}</span>
        <span className="text-(--color-text-muted)">{album.accessNote || "No access note yet."}</span>
      </div>
      <div className={inspectorSectionClassName}>
        <strong className="text-(--color-text)">Owner</strong>
        <span>{relations?.owner?.displayName ?? "No owner assigned"}</span>
        <span className="text-xs text-(--color-text-muted)">Created by {createdBy?.displayName ?? album.createdBy}</span>
      </div>
      <div className={inspectorSectionClassName}>
        <strong className="text-(--color-text)">Related stops</strong>
        {relations?.itineraryItems.length ? relations.itineraryItems.map((item) => (
          <span key={item.id} className="text-sm">{item.day} · {item.activity}</span>
        )) : <span className="text-(--color-text-muted)">Trip-level album</span>}
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
  currentMember,
  trip,
  onCancel,
  onSubmit,
}: {
  album: TripPhotoAlbumLink | null;
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
      <div className={dialogClassName} role="dialog" aria-modal="true" aria-label={album ? "Edit album" : "Add album"}>
        <div className={dialogHeaderClassName}>
          <h2>{album ? "Edit album" : "Add album"}</h2>
          <IconButton type="button" aria-label="Close" onClick={onCancel}><Icon name="x" /></IconButton>
        </div>
        <form className={dialogFormClassName} onSubmit={(event) => void handleSubmit(event)}>
          <div className={dialogGridClassName}>
            <label className={fieldClassName}>
              <span>Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>
            <label className={fieldClassName}>
              <span>Provider</span>
              <select value={provider} onChange={(event) => setProvider(event.target.value as TripPhotoAlbumProvider)}>
                {providerOptions.map((option) => <option key={option} value={option}>{providerLabel(option)}</option>)}
              </select>
            </label>
            <label className={fieldClassName}>
              <span>Access</span>
              <select value={access} onChange={(event) => setAccess(event.target.value as TripPhotoAlbumAccess)}>
                {accessOptions.map((option) => <option key={option} value={option}>{accessLabel(option)}</option>)}
              </select>
            </label>
            <label className={fieldClassName}>
              <span>Owner</span>
              <select value={ownerMemberId} onChange={(event) => setOwnerMemberId(event.target.value)}>
                <option value="">No owner</option>
                {trip.members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
              </select>
            </label>
            <label className={fieldClassName}>
              <span>Album link</span>
              <input value={url} onChange={(event) => setUrl(event.target.value)} required />
            </label>
            <label className={fieldClassName}>
              <span>Day</span>
              <select value={day} onChange={(event) => setDay(event.target.value)}>
                <option value="">Trip-level</option>
                {days.map((candidate) => <option key={candidate} value={candidate}>{candidate}</option>)}
              </select>
            </label>
            <label className={fieldClassName}>
              <span>Description</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <label className={fieldClassName}>
              <span>Access note</span>
              <textarea value={accessNote} onChange={(event) => setAccessNote(event.target.value)} />
            </label>
          </div>
          <fieldset className="grid gap-2 rounded-(--radius-md) border border-(--color-border) p-3">
            <legend className="px-1 text-xs font-extrabold text-(--color-text-muted)">Related itinerary</legend>
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
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit">Save album</Button>
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

function providerLabel(provider: TripPhotoAlbumProvider | "all"): string {
  const labels = {
    all: "All albums",
    google_photos: "Google Photos",
    icloud: "iCloud",
    google_drive: "Google Drive",
    dropbox: "Dropbox",
    onedrive: "OneDrive",
    custom: "Custom",
  } satisfies Record<TripPhotoAlbumProvider | "all", string>;
  return labels[provider];
}

function accessLabel(access: TripPhotoAlbumAccess): string {
  const labels = {
    view_only: "View only",
    collaborative: "Collaborative",
    upload_request: "Upload request",
  } satisfies Record<TripPhotoAlbumAccess, string>;
  return labels[access];
}
