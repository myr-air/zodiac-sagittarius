import { destinationMetaParts } from "./account-trip-destinations";

export function DestinationCardMeta({ detail, meta }: { detail: string; meta: string }) {
  const parts = [detail, ...destinationMetaParts(meta)].filter(Boolean);
  if (!parts.length) return null;

  return (
    <small>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {index > 0 ? <span aria-hidden="true"> · </span> : null}
          <span>{part}</span>
        </span>
      ))}
    </small>
  );
}
