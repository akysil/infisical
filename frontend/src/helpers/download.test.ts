import { describe, expect, test } from "vitest";

import { parseDotEnv } from "@app/components/utilities/parseSecrets";

import { formatSecretEnvFile } from "./download";

const exportValue = (secretValue: string) =>
  formatSecretEnvFile([{ secretKey: "KEY", secretValue }], []);

describe("formatSecretEnvFile", () => {
  test.each([
    [
      '{"type":"service_account","private_key":"-----BEGIN KEY-----\\nABC\\n-----END KEY-----\\n"}',
      'KEY=\'{"type":"service_account","private_key":"-----BEGIN KEY-----\\nABC\\n-----END KEY-----\\n"}\'\n'
    ],
    ["C:\\path\\to\\file", "KEY='C:\\path\\to\\file'\n"],
    ["plain", "KEY='plain'\n"],
    ["", "KEY=''\n"],
    ['{\\"already\\":\\"escaped\\\\n\\"}', 'KEY={\\"already\\":\\"escaped\\\\n\\"}\n'],
    ["\\\\server\\share", "KEY=\\\\server\\share\n"],
    ["path\\", "KEY=path\\\n"],
    [
      '{"label":"O\'Brien","private_key":"ABC\\nDEF"}',
      'KEY={"label":"O\'Brien","private_key":"ABC\\nDEF"}\n'
    ],
    ["it's # here", 'KEY="it\'s # here"\n']
  ])("writes %j as a value dotenv loaders read back unchanged", (value, expected) => {
    expect(exportValue(value)).toBe(expected);
    expect(parseDotEnv(exportValue(value)).KEY.value).toBe(value);
  });

  test("a trailing backslash does not run into the next entry", () => {
    const file = formatSecretEnvFile(
      [
        { secretKey: "A", secretValue: "path\\" },
        { secretKey: "B", secretValue: "owner'#note" }
      ],
      []
    );

    expect(file).toBe('A=path\\\nB="owner\'#note"\n');
  });
});
