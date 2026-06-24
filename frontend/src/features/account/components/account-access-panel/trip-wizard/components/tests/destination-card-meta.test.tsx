import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DestinationCardMeta } from "../destination-card-meta";

describe("DestinationCardMeta", () => {
  it("renders destination detail and meta parts in order", () => {
    render(<DestinationCardMeta detail="Japan" meta="3 nights · Tokyo" />);

    const meta = screen.getByText("Japan").closest("small");
    expect(meta).toBeVisible();
    expect(meta).toHaveTextContent("Japan · 3 nights · Tokyo");
  });

  it("renders nothing when no meta content is available", () => {
    const { container } = render(<DestinationCardMeta detail="" meta="" />);

    expect(container).toBeEmptyDOMElement();
  });
});
