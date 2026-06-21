import { readFileSync } from "node:fs";
import { join } from "node:path";
import { frontendRoot } from "../../../project/contracts/project-contract.helpers";

export function readItineraryArchitectureSource(path: string): string {
  return readFileSync(join(frontendRoot, path), "utf8");
}
