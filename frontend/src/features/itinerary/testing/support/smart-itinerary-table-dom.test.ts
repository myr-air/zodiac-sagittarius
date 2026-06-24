import { afterEach, describe, expect, it } from "vitest";
import {
  getItineraryItemRow,
  getSubItineraryItemLine,
  queryItineraryItemRow,
  querySubItineraryItemLine,
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

  it("finds sub-itinerary lines by item id", () => {
    document.body.innerHTML = `
      <div data-sub-item-id="sub-item-a">Buy Octopus card</div>
    `;

    expect(querySubItineraryItemLine("sub-item-a")).toHaveTextContent(
      "Buy Octopus card",
    );
    expect(getSubItineraryItemLine("sub-item-a")).toHaveTextContent(
      "Buy Octopus card",
    );
  });

  it("returns null or throws when the sub-itinerary line is missing", () => {
    expect(querySubItineraryItemLine("missing-sub-item")).toBeNull();
    expect(() => getSubItineraryItemLine("missing-sub-item")).toThrow(
      "Sub-itinerary line not found: missing-sub-item",
    );
  });
});
