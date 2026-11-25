import { describe, expect, test } from "vitest";

import { parseDotEnv } from "@app/components/utilities/parseSecrets";

import { formatSecretEnvFile } from "./download";

const exportValue = (secretValue: string) =>
  formatSecretEnvFile([{ secretKey: "KEY", secretValue }], []);

describe("formatSecretEnvFile", () => {
  test.each([
    '{"type":"service_account","private_key":"-----BEGIN KEY-----\\nABC\\n-----END KEY-----\\n"}',
    "C:\\path\\to\\file",
    'say "hi"',
    "plain",
    ""
  ])("single-quotes %j so dotenv reads it back unchanged", (value) => {
    expect(exportValue(value)).toBe(`KEY='${value}'\n`);
    expect(parseDotEnv(exportValue(value)).KEY.value).toBe(value);
  });

  test.each([
    ["it's", 'KEY="it\'s"\n'],
    ["\\\\server\\share", 'KEY="\\\\\\\\server\\\\share"\n'],
    ["path\\", 'KEY="path\\\\"\n']
  ])("keeps escaped double quotes for %j", (value, expected) => {
    expect(exportValue(value)).toBe(expected);
  });
});
