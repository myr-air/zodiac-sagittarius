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
import { Icon } from "@/src/ui/icons";
import { formatTripRange, PageHeader } from "@/src/shared/components/page-header";
import { Badge, Button, IconButton, Select, WorkspacePage, WorkspaceSurface } from "@/src/ui";
import { photoCopy, type PhotoCopy } from "./TripPhotosPage.copy";
import * as photoStyles from "./TripPhotosPage.styles";
import {
  countPhotoProviders,
  photoAccessLabel,
  photoAccessOptions,
  photoAlbumLinkHost,
  photoProviderLabel,
  photoProviderOptions,
  photoProviders,
  type PhotoProviderFilter,
} from "./TripPhotosPage.support";

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
  const [activeProvider, setActiveProvider] = useState<PhotoProviderFilter>("all");
  const [selectedAlbumId, setSelectedAlbumId] = useState(photoAlbumLinks[0]?.id ?? "");
  const [dialogAlbum, setDialogAlbum] = useState<TripPhotoAlbumLink | "new" | null>(null);
  const [deleteAlbum, setDeleteAlbum] = useState<TripPhotoAlbumLink | null>(null);
  const summary = useMemo(() => buildPhotoAlbumSummary(photoAlbumLinks), [photoAlbumLinks]);
  const providerCounts = useMemo(() => countPhotoProviders(photoAlbumLinks), [photoAlbumLinks]);
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
    <WorkspacePage className={photoStyles.pageClassName} aria-label={copy.pageLabel} role="region">
      <PageHeader
        title={copy.title}
        subtitle={trip.name}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(trip.startDate, trip.endDate, locale)}</span>
            <span><Icon name="cloud" /> {copy.albumLinks(photoAlbumLinks.length)}</span>
          </>
        )}
      />

      <div className={photoStyles.summaryClassName} aria-label={copy.summaryLabel}>
        <SummaryStat icon="cloud" label={copy.savedDestinations} value={copy.albums(summary.total)} />
        <SummaryStat icon="users" label={copy.sharedUploads} value={copy.collaborative(summary.collaborative)} />
        <SummaryStat icon="import" label={copy.uploadRequests} value={copy.requests(summary.uploadRequests)} />
        <SummaryStat icon="warning" label={copy.needsAccessNote} value={copy.missing(summary.missingAccessNotes)} />
      </div>

      <div className={photoStyles.contentClassName}>
        <WorkspaceSurface as="div" className={photoStyles.panelClassName} density="compact">
          <div className={photoStyles.providerGridClassName} aria-label={copy.providersLabel}>
            {photoProviders.map((provider) => (
              <button
                key={provider}
                type="button"
                className={cn(photoStyles.providerButtonClassName, activeProvider === provider && photoStyles.selectedProviderClassName)}
                onClick={() => setActiveProvider(provider)}
                aria-pressed={activeProvider === provider}
                aria-label={copy.providerCount(photoProviderLabel(provider, copy), providerCounts[provider] ?? 0)}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="grid size-9 place-items-center rounded-(--radius-md) border border-(--color-primary-border) bg-(--color-surface-subtle) text-(--color-primary-strong)">
                    <Icon name={provider === "all" ? "layout" : provider === "dropbox" ? "import" : "cloud"} />
                  </span>
                  <strong className="tabular-nums text-sm text-(--color-text)">{providerCounts[provider] ?? 0}</strong>
                </span>
                <strong className="text-sm font-extrabold text-(--color-text)">{photoProviderLabel(provider, copy)}</strong>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="grid gap-0.5">
              <strong className="text-[15px] font-extrabold text-(--color-text)">{photoProviderLabel(activeProvider, copy)}</strong>
              <span className="text-xs font-semibold text-(--color-text-muted)">{copy.providerHint(visibleAlbums.length)}</span>
            </div>
            {canEditPhotoAlbums ? <Button type="button" onClick={() => setDialogAlbum("new")}><Icon name="plus" /> {copy.addAlbum}</Button> : null}
          </div>

          <div className={photoStyles.cardGridClassName} aria-label={copy.albumLinksLabel}>
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
        </WorkspaceSurface>

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
        <div className={photoStyles.dialogBackdropClassName}>
          <div className={photoStyles.deleteDialogClassName} role="dialog" aria-modal="true" aria-label={copy.deleteAlbum}>
            <h2 className="m-0 text-lg font-extrabold text-(--color-text)">{copy.deleteAlbum}</h2>
            <p className="m-0 text-sm font-medium leading-6 text-(--color-text-muted)">{copy.deletePrompt(deleteAlbum.title)}</p>
            <div className={photoStyles.dialogActionsClassName}>
              <Button type="button" variant="ghost" onClick={() => setDeleteAlbum(null)}>{copy.cancel}</Button>
              <Button type="button" variant="danger" onClick={() => void confirmDelete()}>{copy.deleteAlbum}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </WorkspacePage>
  );
}

function SummaryStat({ icon, label, value }: { icon: Parameters<typeof Icon>[0]["name"]; label: string; value: string }) {
  return (
    <div className={photoStyles.statClassName}>
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
  copy: PhotoCopy;
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
    <article className={cn(photoStyles.albumCardClassName, selected && photoStyles.selectedAlbumClassName)}>
      <button type="button" className="grid min-w-0 gap-2 text-left" onClick={onSelect} aria-label={copy.selectAlbum(album.title)}>
        <span
          aria-label={copy.coverFor(album.title)}
          className={photoStyles.albumCoverClassName}
          role="img"
          style={coverHref ? { backgroundImage: `url(${coverHref})` } : undefined}
        />
        <span className="flex items-center justify-between gap-2">
          <Badge tone={album.access === "collaborative" ? "primary" : album.access === "upload_request" ? "warning" : "route"}>{photoAccessLabel(album.access, copy)}</Badge>
          <span className="text-xs font-extrabold text-(--color-text-muted)">{photoProviderLabel(album.provider, copy)}</span>
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
  copy: PhotoCopy;
  relations: ReturnType<typeof findPhotoAlbumRelations> | null;
  trip: Trip;
}) {
  if (!album) {
    return (
      <WorkspaceSurface className={photoStyles.inspectorClassName} density="compact" aria-label={copy.inspectorLabel}>
        <div className={photoStyles.inspectorSectionClassName}>{copy.selectHint}</div>
      </WorkspaceSurface>
    );
  }
  const href = safePhotoAlbumHref(album.url);
  const createdBy = trip.members.find((member) => member.id === album.createdBy);
  const linkHost = photoAlbumLinkHost(href);
  return (
    <WorkspaceSurface className={photoStyles.inspectorClassName} density="compact" aria-label={copy.inspectorLabel}>
      <div className="grid gap-2">
        <Badge tone={album.access === "collaborative" ? "primary" : album.access === "upload_request" ? "warning" : "route"}>{photoProviderLabel(album.provider, copy)}</Badge>
        <h2 className="m-0 text-xl font-black text-(--color-text)">{album.title}</h2>
        <span className="text-sm font-semibold leading-6 text-(--color-text-muted)">{copy.externalProviderNote}</span>
      </div>
      <div className={photoStyles.inspectorSectionClassName}>
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
      <div className={photoStyles.inspectorSectionClassName}>
        <strong className="text-(--color-text)">{copy.access}</strong>
        <span>{photoAccessLabel(album.access, copy)}</span>
        <span className="text-(--color-text-muted)">{album.accessNote || copy.noAccessNote}</span>
      </div>
      <div className={photoStyles.inspectorSectionClassName}>
        <strong className="text-(--color-text)">{copy.owner}</strong>
        <span>{relations?.owner?.displayName ?? copy.noOwnerAssigned}</span>
        <span className="text-xs text-(--color-text-muted)">{copy.createdBy(createdBy?.displayName ?? album.createdBy)}</span>
      </div>
      <div className={photoStyles.inspectorSectionClassName}>
        <strong className="text-(--color-text)">{copy.relatedStops}</strong>
        {relations?.itineraryItems.length ? relations.itineraryItems.map((item) => (
          <span key={item.id} className="text-sm">{item.day} · {item.activity}</span>
        )) : <span className="text-(--color-text-muted)">{copy.tripLevel}</span>}
      </div>
    </WorkspaceSurface>
  );
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
  copy: PhotoCopy;
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
    <div className={photoStyles.dialogBackdropClassName}>
      <div className={photoStyles.dialogClassName} role="dialog" aria-modal="true" aria-label={album ? copy.editAlbumDialog : copy.addAlbumDialog}>
        <div className={photoStyles.dialogHeaderClassName}>
          <h2>{album ? copy.editAlbumDialog : copy.addAlbumDialog}</h2>
          <IconButton type="button" aria-label={copy.close} onClick={onCancel}><Icon name="x" /></IconButton>
        </div>
        <form className={photoStyles.dialogFormClassName} onSubmit={(event) => void handleSubmit(event)}>
          <div className={photoStyles.dialogGridClassName}>
            <label className={photoStyles.fieldClassName}>
              <span>{copy.titleField}</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>
            <label className={photoStyles.fieldClassName}>
              <span>{copy.providerField}</span>
              <Select value={provider} onChange={(event) => setProvider(event.target.value as TripPhotoAlbumProvider)}>
                {photoProviderOptions.map((option) => <option key={option} value={option}>{photoProviderLabel(option, copy)}</option>)}
              </Select>
            </label>
            <label className={photoStyles.fieldClassName}>
              <span>{copy.accessField}</span>
              <Select value={access} onChange={(event) => setAccess(event.target.value as TripPhotoAlbumAccess)}>
                {photoAccessOptions.map((option) => <option key={option} value={option}>{photoAccessLabel(option, copy)}</option>)}
              </Select>
            </label>
            <label className={photoStyles.fieldClassName}>
              <span>{copy.ownerField}</span>
              <Select value={ownerMemberId} onChange={(event) => setOwnerMemberId(event.target.value)}>
                <option value="">{copy.noOwner}</option>
                {trip.members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
              </Select>
            </label>
            <label className={photoStyles.fieldClassName}>
              <span>{copy.albumLinkField}</span>
              <input value={url} onChange={(event) => setUrl(event.target.value)} required />
            </label>
            <label className={photoStyles.fieldClassName}>
              <span>{copy.dayField}</span>
              <Select value={day} onChange={(event) => setDay(event.target.value)}>
                <option value="">{copy.tripLevel}</option>
                {days.map((candidate) => <option key={candidate} value={candidate}>{candidate}</option>)}
              </Select>
            </label>
            <label className={photoStyles.fieldClassName}>
              <span>{copy.descriptionField}</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <label className={photoStyles.fieldClassName}>
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
          <div className={photoStyles.dialogActionsClassName}>
            <Button type="button" variant="ghost" onClick={onCancel}>{copy.cancel}</Button>
            <Button type="submit">{copy.saveAlbum}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
