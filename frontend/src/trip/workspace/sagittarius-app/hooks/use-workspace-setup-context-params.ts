import type { SagittariusAppProps } from "../types";

export type UseWorkspaceSetupContextParams = Required<
  Pick<
    SagittariusAppProps,
    | "accessMode"
    | "dataSource"
    | "initialTrip"
    | "initialView"
    | "requireJoin"
  >
> &
  Pick<
    SagittariusAppProps,
    | "apiClient"
    | "initialJoinToken"
    | "initialMemberId"
    | "placeResolver"
    | "routeTripId"
  >;
