import { cn } from "@/src/lib/cn";
import { WorkspaceSurface } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import * as bookingStyles from "../BookingsDocsPage.styles";
import { bookingFolders, type BookingFolderId } from "../model/booking-folders";

interface BookingFolderRailProps {
  activeFolderId: BookingFolderId;
  copy: BookingCopy;
  folderCounts: Record<BookingFolderId, number>;
  onSelectFolder: (folderId: BookingFolderId) => void;
}

export function BookingFolderRail({
  activeFolderId,
  copy,
  folderCounts,
  onSelectFolder,
}: BookingFolderRailProps) {
  return (
    <WorkspaceSurface as="nav" className={bookingStyles.folderRailClassName} density="compact" aria-label={copy.bookingFolders}>
      {bookingFolders.map((folder) => (
        <button
          type="button"
          className={cn(bookingStyles.folderButtonClassName, activeFolderId === folder.id && bookingStyles.selectedFolderClassName)}
          key={folder.id}
          onClick={() => onSelectFolder(folder.id)}
          aria-pressed={activeFolderId === folder.id}
          aria-label={copy.folderCount(copy.folders[folder.id].title, folderCounts[folder.id] ?? 0)}
        >
          <span className="grid size-7 place-items-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) text-(--color-primary-strong) max-[1199px]:size-5 max-[1199px]:border-0 max-[1199px]:bg-transparent">
            <Icon name={folder.icon} />
          </span>
          <span className="min-w-0 max-[767px]:hidden">
            <strong className="block truncate text-sm font-extrabold max-[1199px]:text-[11px] max-[1199px]:leading-4">{copy.folders[folder.id].title}</strong>
            <span className="block truncate text-[11px] font-semibold text-(--color-text-muted) max-[1199px]:hidden">{copy.folders[folder.id].description}</span>
          </span>
          <strong className="tabular-nums text-xs text-(--color-text-muted) max-[1199px]:text-[11px]">{folderCounts[folder.id] ?? 0}</strong>
        </button>
      ))}
    </WorkspaceSurface>
  );
}
