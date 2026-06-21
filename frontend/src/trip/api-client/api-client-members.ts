import type { TripParticipantSession } from "../types";
import { tripApiRoutes } from "../api-routes";
import type { TripApiRequester } from "./api-client-transport";
import type {
  JoinInviteTokenResponse,
  TripApiClient,
} from "./api-client-types";
import {
  mapMember,
} from "./api-response-member-mappers";
import {
  mapJoinTripResponse,
} from "./api-response-planning-mappers";
import type {
  JoinTripResponse,
  TripMemberResponse,
} from "./api-response-types";

type TripMemberApiClient = Pick<
  TripApiClient,
  | "joinTrip"
  | "resolveJoinInviteToken"
  | "rotateJoinInviteToken"
  | "claimMember"
  | "loginMember"
  | "logout"
  | "listMembers"
  | "updatePresence"
  | "createMember"
  | "patchMember"
  | "resetMemberClaim"
>;

export function createTripMemberApiClient(request: TripApiRequester): TripMemberApiClient {
  return {
    joinTrip(credentials) {
      return request<JoinTripResponse>(tripApiRoutes.joinSession(), {
        method: "POST",
        body: JSON.stringify({ joinCode: credentials.joinId, tripPassword: credentials.password }),
      }).then(mapJoinTripResponse);
    },
    resolveJoinInviteToken(token) {
      return request<JoinTripResponse>(tripApiRoutes.joinInviteTokenCurrent(token), {
        method: "GET",
      }).then(mapJoinTripResponse);
    },
    rotateJoinInviteToken(tripId, sessionToken) {
      return request<JoinInviteTokenResponse>(tripApiRoutes.joinInviteTokens(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    claimMember(tripId, memberId, participantPassword, joinSessionToken) {
      return request<TripParticipantSession>(tripApiRoutes.claimMember(tripId, memberId), {
        method: "POST",
        body: JSON.stringify({ participantPassword, joinSessionToken }),
      });
    },
    loginMember(tripId, memberId, participantPassword, joinSessionToken) {
      return request<TripParticipantSession>(tripApiRoutes.memberSessions(tripId), {
        method: "POST",
        body: JSON.stringify({ memberId, participantPassword, joinSessionToken }),
      });
    },
    async logout(tripId, sessionToken) {
      await request<void>(tripApiRoutes.currentMemberSession(tripId), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    async listMembers(tripId, sessionToken) {
      const members = await request<TripMemberResponse[]>(tripApiRoutes.members(tripId), {
        method: "GET",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return members.map(mapMember);
    },
    async updatePresence(tripId, sessionToken, presenceRequest) {
      const member = await request<TripMemberResponse>(tripApiRoutes.presence(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(presenceRequest),
      });
      return mapMember(member);
    },
    async createMember(tripId, sessionToken, memberRequest) {
      const member = await request<TripMemberResponse>(tripApiRoutes.members(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(memberRequest),
      });
      return mapMember(member);
    },
    async patchMember(tripId, memberId, sessionToken, memberRequest) {
      const member = await request<TripMemberResponse>(tripApiRoutes.member(tripId, memberId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(memberRequest),
      });
      return mapMember(member);
    },
    async resetMemberClaim(tripId, memberId, sessionToken) {
      const member = await request<TripMemberResponse>(tripApiRoutes.resetMemberClaim(tripId, memberId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return mapMember(member);
    },
  };
}
