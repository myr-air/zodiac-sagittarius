export class TripApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(input: { code: string; message: string; status: number }) {
    super(input.message);
    this.name = "TripApiError";
    this.code = input.code;
    this.status = input.status;
  }
}
