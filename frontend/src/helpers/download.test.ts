import { describe, expect, test } from "vitest";

import { formatSecretEnvFile } from "./download";

const credential = String.raw`{"type":"service_account","private_key":"-----BEGIN KEY-----\nABC\n-----END KEY-----\n"}`;
const alreadyEscaped = String.raw`{\"already\":\"escaped\\n\"}`;

const exportValue = (secretValue: string, format?: "cli") =>
  formatSecretEnvFile([{ secretKey: "KEY", secretValue }], [], format);

describe("formatSecretEnvFile", () => {
  test.each([
    [
      credential,
      String.raw`KEY="{\"type\":\"service_account\",\"private_key\":\"-----BEGIN KEY-----\\nABC\\n-----END KEY-----\\n\"}"`
    ],
    [alreadyEscaped, String.raw`KEY="{\\\"already\\\":\\\"escaped\\\\n\\\"}"`],
    ["it's", `KEY="it's"`],
    ["", `KEY=""`]
  ])("keeps the escaped double-quoted default for %j", (value, expected) => {
    expect(exportValue(value)).toBe(`${expected}\n`);
  });

  test("keeps the default output for neighboring entries and comments", () => {
    const file = formatSecretEnvFile(
      [
        { secretKey: "A", secretValue: "path\\" },
        { secretKey: "B", secretValue: "plain" },
        { secretKey: "C", secretValue: "x", secretComment: 'Owner said "' }
      ],
      []
    );

    expect(file).toBe(`A="path\\\\"\nB="plain"\n# Owner said "\nC="x"\n`);
  });

  test.each([
    [
      credential,
      String.raw`KEY='{"type":"service_account","private_key":"-----BEGIN KEY-----\nABC\n-----END KEY-----\n"}'`
    ],
    [alreadyEscaped, String.raw`KEY='{\"already\":\"escaped\\n\"}'`]
  ])("writes %j single-quoted and unescaped in the CLI format", (value, expected) => {
    expect(exportValue(value, "cli")).toBe(`${expected}\n`);
  });
});
