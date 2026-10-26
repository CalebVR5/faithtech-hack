import { afterEach, describe, expect, it } from "vitest";
import { LANGUAGE_IDS } from "@/lib/domain/languages";
import { STORY_TTL_MS, TEMP_FILE_TTL_MS } from "@/lib/domain/limits";
import { productionProblems } from "@/lib/server/production-checks";
import { LEGAL, LEGAL_FACTS, type Block, type LegalDocument } from "./index";
import { missingOperatorSettings, operatorInfo } from "./operator";

const OPERATOR = { name: "Test Operator", address: "1 Main St, Denver, CO 80202", state: "Colorado" };
const text = (doc: LegalDocument) =>
  [doc.title, doc.summary, ...doc.sections.flatMap((s) => [s.heading, ...s.blocks.flatMap((b: Block) => (typeof b === "string" ? [b] : b.list))])].join("\n");

describe("legal notices", () => {
  it.each(["privacy", "terms"] as const)("%s has the same sections in every language", (kind) => {
    const ids = (id: (typeof LANGUAGE_IDS)[number]) => LEGAL[id][kind](OPERATOR, LEGAL_FACTS).sections.map((s) => s.id);
    for (const id of LANGUAGE_IDS) expect(ids(id)).toEqual(ids("en"));
  });

  it.each(LANGUAGE_IDS)("%s names the operator and uses only known link tokens", (id) => {
    for (const kind of ["privacy", "terms"] as const) {
      const body = text(LEGAL[id][kind](OPERATOR, LEGAL_FACTS));
      expect(body).toContain(OPERATOR.name);
      expect(body).toContain("{email}");
      expect(body.match(/\{[a-z]+\}/g)?.every((t) => ["{email}", "{terms}", "{privacy}"].includes(t))).toBe(true);
      expect(body).not.toMatch(/undefined|NaN|\[object/);
    }
  });

  it("states the deletion times the code enforces", () => {
    expect(LEGAL_FACTS.storyHours).toBe(STORY_TTL_MS / 3_600_000);
    expect(LEGAL_FACTS.mediaHours).toBe(TEMP_FILE_TTL_MS / 3_600_000);
    for (const id of LANGUAGE_IDS) {
      const body = text(LEGAL[id].privacy(OPERATOR, LEGAL_FACTS));
      expect(body).toContain(`${LEGAL_FACTS.storyHours} `);
      expect(body).toContain(`${LEGAL_FACTS.logDays} `);
    }
  });
});

describe("production checks", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  const complete = {
    LANGUAGE_PROVIDER: "gcp",
    GOOGLE_API_KEY: "test-key",
    LEGAL_OPERATOR_NAME: OPERATOR.name,
    LEGAL_CONTACT_EMAIL: "privacy@example.com",
    LEGAL_MAILING_ADDRESS: OPERATOR.address,
    LEGAL_GOVERNING_STATE: OPERATOR.state,
  };

  it("passes with the real provider and every operator setting", () => {
    process.env = { ...saved, ...complete };
    expect(productionProblems()).toEqual([]);
    expect(operatorInfo()).toEqual({ ...OPERATOR, email: "privacy@example.com" });
  });

  it("refuses mock mode, an unset provider and a missing key", () => {
    process.env = { ...saved, ...complete, LANGUAGE_PROVIDER: "mock", GOOGLE_API_KEY: "" };
    const problems = productionProblems();
    expect(problems).toHaveLength(2);
    expect(problems[0]).toMatch(/LANGUAGE_PROVIDER.*"mock"/);
    expect(problems[1]).toMatch(/GOOGLE_API_KEY/);
    process.env = { ...saved, ...complete };
    delete process.env.LANGUAGE_PROVIDER;
    expect(productionProblems()[0]).toMatch(/unset/);
  });

  it("names each missing operator setting", () => {
    process.env = { ...saved, ...complete, LEGAL_CONTACT_EMAIL: " ", LEGAL_GOVERNING_STATE: "" };
    expect(missingOperatorSettings()).toEqual(["LEGAL_CONTACT_EMAIL", "LEGAL_GOVERNING_STATE"]);
    expect(operatorInfo()).toBeNull();
    expect(productionProblems()).toHaveLength(2);
  });
});
