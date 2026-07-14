export const joinPageClassName = "join-page grid min-h-screen place-items-center bg-(--color-page) p-8 max-[767px]:p-3.5";
export const joinShellClassName = "join-shell grid w-[min(100%,860px)] gap-[18px] rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-[22px] shadow-[0_10px_22px_rgb(55_47_38_/_0.055)] max-[767px]:p-4";
export const joinHeroClassName = "join-hero grid grid-cols-[48px_minmax(0,1fr)] items-start gap-3.5 max-[767px]:grid-cols-[40px_minmax(0,1fr)] [&_h1]:m-0 [&_h1]:text-[28px] [&_h1]:leading-9 [&_h1]:text-(--color-text) max-[767px]:[&_h1]:text-[23px] max-[767px]:[&_h1]:leading-[30px] [&_p:not(.join-eyebrow)]:m-0 [&_p:not(.join-eyebrow)]:mt-1 [&_p:not(.join-eyebrow)]:text-sm [&_p:not(.join-eyebrow)]:leading-[22px] [&_p:not(.join-eyebrow)]:text-(--color-text-muted)";
export const joinMarkClassName = "join-mark grid size-12 place-items-center rounded-(--radius-md) bg-(--color-primary) text-white max-[767px]:size-10 [&_.icon]:size-6";
export const joinEyebrowClassName = "join-eyebrow mb-0.5 mt-0 text-xs font-extrabold uppercase tracking-normal text-(--color-primary-strong)";
export const joinAlertClassName = "join-alert m-0 inline-flex items-center gap-2 rounded-(--radius-md) border border-(--color-danger-border) bg-(--color-danger-soft) px-3 py-2.5 text-[13px] font-bold text-(--color-danger)";
export const joinAlertStackClassName =
  "join-alert-stack pointer-events-none fixed top-4 right-[clamp(18px,4vw,44px)] left-auto z-[60] grid w-[min(430px,calc(100vw-36px))] gap-2.5 max-[767px]:top-auto max-[767px]:right-0 max-[767px]:left-0 max-[767px]:bottom-5 max-[767px]:px-[18px] [&_.join-alert]:pointer-events-auto [&_.join-alert]:min-h-12 [&_.join-alert]:w-full [&_.join-alert]:justify-start [&_.join-alert]:rounded-(--radius-lg) [&_.join-alert]:shadow-[0_10px_22px_rgb(15_23_42_/_0.1)]";
export const joinFormClassName = "join-form grid gap-3 [&_input]:min-h-[42px] [&_input]:w-full [&_input]:rounded-(--radius-md) [&_input]:border [&_input]:border-(--color-border-strong) [&_input]:bg-(--color-surface) [&_input]:px-3 [&_input]:text-(--color-text) [&_input]:focus:border-(--color-primary-border) [&_input]:focus:shadow-[0_0_0_3px_var(--color-primary-soft)] [&_label]:grid [&_label]:gap-1.5 [&_label]:text-[13px] [&_label]:font-bold [&_label]:text-(--color-text-muted)";
export const participantAuthClassName = "participant-auth col-span-full grid gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-3.5 [&_input]:min-h-[42px] [&_input]:w-full [&_input]:rounded-(--radius-md) [&_input]:border [&_input]:border-(--color-border-strong) [&_input]:bg-(--color-surface) [&_input]:px-3 [&_input]:text-(--color-text) [&_label]:grid [&_label]:gap-1.5 [&_label]:text-[13px] [&_label]:font-bold [&_label]:text-(--color-text-muted)";
export const joinSubmitClassName = "join-submit min-h-[42px] justify-center";
export const participantStepClassName = "participant-step grid gap-4";
export const participantGridClassName = "participant-grid grid grid-cols-2 gap-2.5 max-[767px]:grid-cols-1";
export const participantCardClassName = "participant-card grid min-h-[72px] grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-3 text-left text-(--color-text) transition-[border-color,box-shadow,background] duration-150 hover:border-(--color-primary-border) hover:bg-(--color-primary-soft) hover:shadow-[0_10px_22px_rgb(15_23_42_/_0.06)] data-[selected=true]:border-(--color-primary-border) data-[selected=true]:bg-(--color-primary-soft) data-[selected=true]:shadow-[0_10px_22px_rgb(15_23_42_/_0.06)] max-[767px]:grid-cols-[38px_minmax(0,1fr)] max-[767px]:[&_.badge]:col-start-2 max-[767px]:[&_.badge]:justify-self-start [&_small]:block [&_small]:text-xs [&_small]:leading-[18px] [&_small]:text-(--color-text-muted) [&_strong]:block [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-sm [&_strong]:leading-5 [&_strong]:text-(--color-text)";
export const participantAvatarClassName = "person-avatar grid size-[30px] place-items-center rounded-full text-xs font-extrabold text-white";
export const passwordInputRowClassName = "password-input-row relative block";
export const passwordVisibilityButtonClassName = "password-visibility-button absolute right-2 top-1/2 size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-(--radius-sm) bg-transparent text-(--color-text-muted) hover:text-(--color-primary-strong) focus-visible:text-(--color-primary-strong) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary-border) focus-visible:ring-offset-1";
export const participantAuthHelpClassName = "participant-auth-help m-0 text-xs leading-[18px] text-(--color-text-muted)";
export const embeddedJoinPageClassName = "!block !min-h-auto !bg-transparent !p-0";
export const embeddedJoinShellClassName = "!w-[min(100%,640px)] justify-self-center shadow-[var(--shadow-panel)]";
export const tripAccessJoinShellClassName =
  "!w-full justify-self-stretch !grid-cols-[minmax(330px,0.86fr)_minmax(360px,1fr)] !gap-0 overflow-hidden !rounded-(--radius-lg) !border-(--color-border) !bg-(--color-surface) !p-0 !shadow-[0_12px_28px_rgb(55_47_38_/_0.07)] max-[767px]:!grid-cols-1";
export const tripAccessContentClassName =
  "col-start-2 mx-[clamp(20px,4vw,44px)] max-[767px]:col-start-1 max-[767px]:mx-4";
export const tripAccessHeroClassName =
  "mt-[clamp(28px,5vw,54px)] !grid-cols-[52px_minmax(0,1fr)] max-[767px]:mt-[18px] max-[767px]:!grid-cols-[42px_minmax(0,1fr)] [&_h1]:!text-[34px] [&_h1]:!leading-10 max-[767px]:[&_h1]:!text-[27px] max-[767px]:[&_h1]:!leading-[34px] [&_p:not(.join-eyebrow)]:max-w-[520px] [&_p:not(.join-eyebrow)]:!text-[15px] [&_p:not(.join-eyebrow)]:!leading-6 max-[767px]:[&_p:not(.join-eyebrow)]:!text-[13.5px] max-[767px]:[&_p:not(.join-eyebrow)]:!leading-[21px]";
export const tripAccessJoinMarkClassName =
  "!size-[52px] bg-(--color-primary) text-white max-[767px]:!size-[42px]";
export const tripAccessFormClassName =
  "my-[clamp(28px,5vw,54px)] mt-[18px] !gap-3.5 max-[767px]:mt-4 max-[767px]:mb-[18px] [&_input]:!min-h-[50px] [&_input]:!rounded-(--radius-md) [&_input]:!border-(--color-border-strong) [&_label]:!gap-2";
export const tripAccessParticipantStepClassName =
  "my-[clamp(28px,5vw,54px)] mt-[18px] max-[767px]:mt-4 max-[767px]:mb-[18px] [&_.participant-auth_label]:!gap-2 [&_.participant-auth_input]:!min-h-[50px] [&_.participant-auth_input]:!rounded-(--radius-md) [&_.participant-auth_input]:!border-(--color-border-strong)";
export const tripAccessSubmitClassName = "!min-h-[52px] !rounded-(--radius-md) !mt-5 shadow-[0_8px_18px_rgb(15_118_110_/_0.12)]";
export const tripAccessRightColumnClassName = "trip-access-right-col col-start-2 row-start-1 row-span-4 flex flex-col justify-start max-[767px]:col-start-1 max-[767px]:row-auto";
export const tripAccessVisualClassName =
  "trip-access-visual relative col-start-1 row-start-1 row-span-4 min-h-[620px] overflow-hidden border-r border-(--color-border) bg-(--color-surface-subtle) p-7 max-[767px]:col-start-1 max-[767px]:row-auto max-[767px]:min-h-0 max-[767px]:border-r-0 max-[767px]:border-b max-[767px]:p-4";
export const tripAccessVisualWashClassName =
  "absolute inset-0 pointer-events-none bg-[url('/landing/auth/bg-map-watercolor.png')] bg-cover bg-center opacity-20";
export const tripAccessPhotoStackClassName = "trip-access-photo-stack relative z-[1] min-h-[380px] max-[767px]:min-h-[200px]";
export const tripAccessPhotoClassName =
  "trip-access-photo absolute overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-cover bg-center shadow-[0_10px_22px_rgb(15_23_42_/_0.1)]";
export const tripAccessPhotoKrabiClassName =
  "trip-access-photo--krabi left-0 top-6 aspect-[4/5] w-[72%] bg-[url('/landing/auth/photo-krabi.png')] max-[767px]:top-2 max-[767px]:w-1/2 max-[767px]:aspect-[4/3]";
export const tripAccessPhotoKyotoClassName =
  "trip-access-photo--kyoto right-0 top-0 aspect-[3/4] w-[46%] bg-[url('/landing/auth/photo-kyoto.png')] max-[767px]:left-[37%] max-[767px]:right-auto max-[767px]:w-[34%] max-[767px]:aspect-square";
export const tripAccessPhotoSantoriniClassName =
  "trip-access-photo--santorini right-[6%] bottom-0 aspect-[4/3] w-[54%] bg-[url('/landing/auth/photo-santorini.png')] max-[767px]:left-1/2 max-[767px]:right-auto max-[767px]:top-1/2 max-[767px]:bottom-auto max-[767px]:w-[90%] max-[767px]:-translate-x-1/2 max-[767px]:-translate-y-1/2";
export const tripAccessRouteCardClassName =
  "trip-access-route-card relative z-[1] mt-[18px] grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3.5 py-[13px] shadow-[0_8px_18px_rgb(15_23_42_/_0.06)] max-[767px]:hidden";
export const tripAccessRouteStopClassName = "trip-access-route-stop text-xs font-[850] text-(--color-text)";
export const tripAccessRouteLineClassName =
  "trip-access-route-line h-0.5 rounded-full bg-[linear-gradient(90deg,var(--color-primary),var(--color-route),var(--color-warning))]";
export const tripAccessNotesClassName =
  "trip-access-notes relative z-[1] m-0 mt-[18px] grid list-none gap-2.5 p-0 max-[767px]:hidden [&_.icon]:size-[34px] [&_.icon]:rounded-(--radius-sm) [&_.icon]:bg-(--color-primary-soft) [&_.icon]:p-2 [&_.icon]:text-(--color-primary-strong) [&_li]:grid [&_li]:grid-cols-[34px_minmax(0,1fr)] [&_li]:items-center [&_li]:gap-2.5 [&_li]:rounded-(--radius-md) [&_li]:border [&_li]:border-(--color-border) [&_li]:bg-(--color-surface) [&_li]:p-3 [&_small]:block [&_small]:text-xs [&_small]:font-[650] [&_small]:leading-[17px] [&_small]:text-(--color-text-muted) [&_strong]:block [&_strong]:text-[13px] [&_strong]:leading-[18px] [&_strong]:text-(--color-text)";
