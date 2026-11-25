import { describe, expect, test } from "vitest";

import { parseDotEnv } from "@app/components/utilities/parseSecrets";

import { formatSecretEnvFile } from "./download";

const exportValue = (secretValue: string) =>
  formatSecretEnvFile([{ secretKey: "KEY", secretValue }], []);

describe("formatSecretEnvFile", () => {
  test("single-quotes values without escaping them", () => {
    expect(exportValue('{"a":"b\\nc"}')).toBe('KEY=\'{"a":"b\\nc"}\'\n');
  });

  test.each([
    '{"type":"service_account","private_key":"-----BEGIN KEY-----\\nABC\\n-----END KEY-----\\n"}',
    '{\\"already\\":\\"escaped\\\\n\\"}',
    "C:\\path\\to\\file",
    "plain",
    "it's"
  ])("round-trips %j through a dotenv parser", (value) => {
    expect(parseDotEnv(exportValue(value)).KEY.value).toBe(value);
  });
});
