import FileSaver from "file-saver";

import { SecretType } from "@app/hooks/api/types";

type SecretEnvFileSecret = {
  secretKey: string;
  secretValue?: string;
  secretComment?: string;
  type?: string;
};

type SecretEnvFileImport = {
  secrets: SecretEnvFileSecret[];
};

type SecretEnvFileEntry = {
  key: string;
  value: string;
  comment?: string;
};

export const downloadTxtFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  FileSaver.saveAs(blob, filename);
};

const getSecretEnvFileEntries = (
  localSecrets: SecretEnvFileSecret[],
  importedSecrets: SecretEnvFileImport[]
) => {
  const secretsPicked = new Set<string>();
  const secretsToDownload: SecretEnvFileEntry[] = [];

  // Build a map of personal override values (personal overrides take precedence)
  const personalOverrides = new Map<string, { value?: string }>();
  localSecrets.forEach((el) => {
    if (el.type === SecretType.Personal) {
      personalOverrides.set(el.secretKey, { value: el.secretValue });
    }
  });
  importedSecrets.forEach((imp) => {
    imp.secrets.forEach((el) => {
      if (el.type === SecretType.Personal) {
        personalOverrides.set(el.secretKey, { value: el.secretValue });
      }
    });
  });

  localSecrets.forEach((el) => {
    if (el.type === SecretType.Personal) return;

    secretsPicked.add(el.secretKey);
    const override = personalOverrides.get(el.secretKey);
    secretsToDownload.push({
      key: el.secretKey,
      value: (override ? override.value : el.secretValue) ?? "",
      comment: el.secretComment
    });
  });

  for (let i = importedSecrets.length - 1; i >= 0; i -= 1) {
    for (let j = importedSecrets[i].secrets.length - 1; j >= 0; j -= 1) {
      const secret = importedSecrets[i].secrets[j];
      // eslint-disable-next-line no-continue
      if (secret.type === SecretType.Personal) continue;

      if (!secretsPicked.has(secret.secretKey)) {
        const override = personalOverrides.get(secret.secretKey);
        secretsToDownload.push({
          key: secret.secretKey,
          value: (override ? override.value : secret.secretValue) ?? "",
          comment: secret.secretComment
        });
      }
      secretsPicked.add(secret.secretKey);
    }
  }

  return secretsToDownload;
};

export const getSecretEnvFileEntryCount = (
  localSecrets: SecretEnvFileSecret[],
  importedSecrets: SecretEnvFileImport[]
) => getSecretEnvFileEntries(localSecrets, importedSecrets).length;

// Node dotenv never unescapes \" or \\, and python-dotenv decodes \\ and \' inside single quotes, so a
// value is written in the first form both read back verbatim: single-quoted, then unquoted. A backslash
// before the closing quote would escape it and swallow the next line.
const formatEnvValue = (value: string) => {
  if (!value.includes("'") && !value.includes("\\\\") && !value.endsWith("\\")) return `'${value}'`;
  if (/^[^\s'"`#](?:[^#\r\n]*[^\s#])?$/.test(value)) return value;
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
};

/**
 * Merges local secrets with imported secrets (local > later imports > earlier imports),
 * and formats them as a .env file string.
 * Personal overrides take precedence over shared secret values.
 */
export const formatSecretEnvFile = (
  localSecrets: SecretEnvFileSecret[],
  importedSecrets: SecretEnvFileImport[]
) =>
  getSecretEnvFileEntries(localSecrets, importedSecrets)
    .sort((a, b) => a.key.toLowerCase().localeCompare(b.key.toLowerCase()))
    .reduce((prev, { key, comment, value }) => {
      const formattedValue = formatEnvValue(value);

      if (!comment) return `${prev}${key}=${formattedValue}\n`;

      const commentLines = comment
        .split("\n")
        .map((line) => (line.trim() ? `# ${line}` : "#"))
        .join("\n");

      return `${prev}${commentLines}\n${key}=${formattedValue}\n`;
    }, "");

export const downloadSecretEnvFile = (
  environment: string,
  localSecrets: SecretEnvFileSecret[],
  importedSecrets: SecretEnvFileImport[]
) => {
  downloadTxtFile(`${environment}.env`, formatSecretEnvFile(localSecrets, importedSecrets));
};

export const downloadFile = (content: string, filename: string, mimeType: string = "text/csv") => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
