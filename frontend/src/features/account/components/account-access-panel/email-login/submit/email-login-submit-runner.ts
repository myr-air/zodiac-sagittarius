export async function runEmailLoginSubmission<T>({
  onError,
  run,
  setIsSubmitting,
}: {
  onError: (caught: unknown) => void;
  run: () => Promise<T>;
  setIsSubmitting: (isSubmitting: boolean) => void;
}) {
  setIsSubmitting(true);
  try {
    return await run();
  } catch (caught) {
    onError(caught);
    return undefined;
  } finally {
    setIsSubmitting(false);
  }
}
