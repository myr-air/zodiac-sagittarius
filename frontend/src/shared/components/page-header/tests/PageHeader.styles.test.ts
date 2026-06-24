import { describe, expect, it } from "vitest";
import {
  descriptionClassName,
  metaClassName,
  pageHeaderClassName,
  pageHeaderWithAsideClassName,
  userCardClassName,
} from "../PageHeader.styles";

describe("PageHeader styles", () => {
  it("keeps page header layout styles centralized for the shared component", () => {
    expect(pageHeaderClassName).toContain("page-header");
    expect(pageHeaderClassName).toContain("max-[1199px]:rounded-none");
    expect(pageHeaderWithAsideClassName).toContain("grid-cols-[minmax(0,1fr)_minmax(180px,260px)]");
    expect(descriptionClassName).toContain("page-header-description");
    expect(metaClassName).toContain("page-header-meta");
    expect(userCardClassName).toContain("page-current-user");
  });
});
