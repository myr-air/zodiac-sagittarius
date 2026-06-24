import { describe, expect, it } from "vitest";
import { buildCompletedPostcardLabels } from "../overview-completed-postcard";

describe("completed postcard labels", () => {
  it("builds English labels and stat values", () => {
    expect(
      buildCompletedPostcardLabels({
        dayCount: 4,
        locale: "en",
        stopCount: 9,
        tripName: "Hong Kong Trip",
      }),
    ).toEqual({
      budgetLabel: "Total Budget",
      durationLabel: "Duration",
      durationValue: "4 Days",
      message:
        "The Hong Kong Trip has completed. Hope this journey left you with beautiful memories and meaningful connections!",
      stopsLabel: "Places Visited",
      stopsValue: "9 Stops",
      title: "Thank you for traveling!",
    });
  });

  it("builds Thai labels and stat values", () => {
    expect(
      buildCompletedPostcardLabels({
        dayCount: 3,
        locale: "th",
        stopCount: 7,
        tripName: "ฮ่องกง",
      }),
    ).toEqual({
      budgetLabel: "ยอดใช้จ่ายรวม",
      durationLabel: "ระยะเวลา",
      durationValue: "3 วัน",
      message:
        "ทริป ฮ่องกง ได้เสร็จสิ้นลงแล้วอย่างสมบูรณ์แบบ หวังว่าคุณจะได้รับความทรงจำและมิตรภาพที่ยอดเยี่ยมระหว่างเดินทาง!",
      stopsLabel: "สถานที่เช็คอิน",
      stopsValue: "7 จุด",
      title: "ขอบคุณสำหรับการเดินทาง!",
    });
  });
});
