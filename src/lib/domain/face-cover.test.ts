import { describe, expect, it } from "vitest";
import { clampBox, coverFromSamples, crowdedMoments, isBox, summarizeMoments, uncoveredMoments, type FaceSample } from "./face-cover";

const face = (x: number, y: number, s = 0.2) => ({ x, y, w: s, h: s });

describe("face cover", () => {
  const samples: FaceSample[] = [
    { timeMs: 0, faces: [face(0.4, 0.3)] },
    { timeMs: 250, faces: [face(0.45, 0.32)] },
    { timeMs: 500, faces: [] },
    { timeMs: 750, faces: [face(0.38, 0.28)] },
  ];

  it("covers every detected position with room to spare", () => {
    const cover = coverFromSamples(samples)!;
    expect(uncoveredMoments(samples, cover)).toEqual([]);
    // Extra room above the face for hair.
    expect(cover.y).toBeLessThan(0.28 - 0.1);
    expect(cover.x + cover.w).toBeLessThanOrEqual(1);
  });

  it("finds moments the person has left uncovered after shrinking the cover", () => {
    const tight = { x: 0.4, y: 0.3, w: 0.2, h: 0.2 };
    expect(uncoveredMoments(samples, tight)).toEqual([250, 750]);
    expect(summarizeMoments([250, 750, 12_400])).toEqual(["0:00", "0:12"]);
  });

  it("proposes nothing when no face was found, so the person places the cover", () => {
    expect(coverFromSamples([{ timeMs: 0, faces: [] }])).toBeNull();
  });

  it("notes moments with more than one face", () => {
    expect(crowdedMoments([{ timeMs: 1000, faces: [face(0.1, 0.1), face(0.6, 0.1)] }])).toEqual([1000]);
  });

  it("keeps covers inside the frame and rejects malformed ones", () => {
    expect(clampBox({ x: 0.9, y: -0.2, w: 0.5, h: 0.02 })).toEqual({ x: 0.5, y: 0, w: 0.5, h: 0.08 });
    expect(isBox({ x: 0.1, y: 0.1, w: 0.5, h: 0.5 })).toBe(true);
    expect(isBox({ x: 0.8, y: 0.1, w: 0.5, h: 0.5 })).toBe(false);
    expect(isBox({ x: "0", y: 0, w: 1, h: 1 })).toBe(false);
  });
});
