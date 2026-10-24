import { describe, expect, it } from "vitest";
import { LANGUAGE_IDS } from "@/lib/domain/languages";
import { OUTPUT_LABELS } from "@/lib/domain/output-labels";
import { MESSAGES } from "./index";

/** Keys, list lengths and which entries are functions, so every locale renders the same screens. */
function shape(value: unknown): unknown {
  if (typeof value === "function") return `fn/${value.length}`;
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, shape((value as Record<string, unknown>)[k])]));
  }
  return typeof value;
}

describe("locale files", () => {
  it.each(LANGUAGE_IDS.filter((id) => id !== "en"))("%s matches the English structure", (id) => {
    expect(shape(MESSAGES[id])).toEqual(shape(MESSAGES.en));
  });

  it.each(LANGUAGE_IDS)("%s has no empty strings", (id) => {
    const empties: string[] = [];
    const walk = (v: unknown, path: string) => {
      if (typeof v === "string" && !v.trim()) empties.push(path);
      else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
    };
    walk(MESSAGES[id], id);
    walk(OUTPUT_LABELS[id], `${id}.output`);
    expect(empties).toEqual([]);
  });

  it("contracts articles in consent sentences", () => {
    // "à le service" / "a el servicio" would be ungrammatical; the intro must read cleanly with either service name.
    for (const id of ["fr", "es-419", "pt-BR"] as const) {
      const text = MESSAGES[id].cloud.intro(MESSAGES[id].cloud.serviceMock);
      expect(text).not.toMatch(/ à le | a el | de el /);
      expect(MESSAGES[id].cloud.uses).toHaveLength(3);
    }
  });
});
