import { afterEach, describe, expect, it } from "vitest";
import {
  getItineraryItemRow,
  queryItineraryItemRow,
} from "./smart-itinerary-table-dom";

describe("smart itinerary table DOM support", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("finds itinerary rows by item id", () => {
    document.body.innerHTML = `
      <table>
        <tbody>
          <tr data-item-id="item-a"><td>Harbour transfer</td></tr>
        </tbody>
      </table>
    `;

    expect(queryItineraryItemRow("item-a")).toHaveTextContent("Harbour transfer");
    expect(getItineraryItemRow("item-a")).toHaveTextContent("Harbour transfer");
  });

  it("returns null or throws when the row is missing", () => {
    expect(queryItineraryItemRow("missing")).toBeNull();
    expect(() => getItineraryItemRow("missing")).toThrow("Itinerary row not found: missing");
  });
});
