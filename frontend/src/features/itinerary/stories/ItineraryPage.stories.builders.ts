export function ownerArgsStory<Story>(
  baseArgs: object,
  args: object,
  play?: unknown,
  parameters?: unknown,
): Story {
  return {
    args: { ...baseArgs, ...args },
    ...(parameters ? { parameters } : {}),
    ...(play ? { play } : {}),
  } as Story;
}

export function viewportStory<Story>(
  baseArgs: object,
  defaultViewport: string,
  play: unknown,
  args: object = {},
): Story {
  return ownerArgsStory<Story>(baseArgs, args, play, {
    viewport: { defaultViewport },
  });
}
