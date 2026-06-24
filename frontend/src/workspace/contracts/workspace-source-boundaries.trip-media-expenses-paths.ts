export const workspaceTripMediaExpenseBoundarySourcePaths = {
  photoAlbumsHook: "src/trip/workspace/sagittarius-app/hooks/use-workspace-photo-albums.ts",
  photoAlbumApiCommands: "src/trip/workspace/sagittarius-app/hooks/photo-albums/use-workspace-api-photo-album-commands.ts",
  photoAlbumLocalCommands: "src/trip/workspace/sagittarius-app/hooks/photo-albums/use-workspace-local-photo-album-commands.ts",
  placeTypes: "src/trip/places/place-types.ts",
  photoAlbumsDomain: "src/trip/photo-albums/index.ts",
  photoAlbumApi: "src/trip/photo-albums/photo-album-api.ts",
  photoAlbumLocal: "src/trip/photo-albums/photo-album-local.ts",
  photoAlbumQuery: "src/trip/photo-albums/photo-album-query.ts",
  expenseMutationCommands: "src/trip/workspace/sagittarius-app/hooks/expenses/use-workspace-expense-mutation-commands.ts",
  expenseMutationCommandTypes:
    "src/trip/workspace/sagittarius-app/hooks/expenses/workspace-expense-mutation-command-types.ts",
  createExpenseCommand:
    "src/trip/workspace/sagittarius-app/hooks/expenses/use-create-workspace-expense-command.ts",
  deleteExpenseCommand:
    "src/trip/workspace/sagittarius-app/hooks/expenses/use-delete-workspace-expense-command.ts",
  updateExpenseCommand:
    "src/trip/workspace/sagittarius-app/hooks/expenses/use-update-workspace-expense-command.ts",
  expenseDrafts: "src/trip/expenses/expense-drafts.ts",
  expenseSummary: "src/trip/expenses/expense-summary.ts",
  expenseSettlements: "src/trip/expenses/expense-settlements.ts",
} as const;
