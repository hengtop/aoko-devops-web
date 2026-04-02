type DetectedLanguage =
  | "plaintext"
  | "json"
  | "yaml"
  | "toml"
  | "properties"
  | "ini"
  | "bash"
  | "shell"
  | "nginx"
  | "xml"
  | "dockerfile"
  | "javascript"
  | "typescript"
  | "sql";

export type ConfigCodePresentation = {
  language: DetectedLanguage;
  label: string;
  content: string;
  lineCount: number;
  formatted: boolean;
};

function normalizeExt(value?: string) {
  return value?.trim().replace(/^\./, "").toLowerCase() ?? "";
}

function normalizeFileName(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function resolveDetectedLanguage(ext?: string, fileName?: string, content?: string): DetectedLanguage {
  const normalizedExt = normalizeExt(ext);
  const normalizedFileName = normalizeFileName(fileName);
  const trimmedContent = content?.trim() ?? "";

  if (
    normalizedFileName === "dockerfile" ||
    normalizedFileName.endsWith("/dockerfile") ||
    normalizedExt === "dockerfile"
  ) {
    return "dockerfile";
  }

  if (
    normalizedFileName === ".env" ||
    normalizedFileName.endsWith(".env") ||
    ["env", "properties"].includes(normalizedExt)
  ) {
    return "properties";
  }

  if (normalizedFileName.includes("nginx") || normalizedExt === "nginx") {
    return "nginx";
  }

  if (["json", "jsonc"].includes(normalizedExt)) {
    return "json";
  }

  if (["yaml", "yml"].includes(normalizedExt)) {
    return "yaml";
  }

  if (["toml"].includes(normalizedExt)) {
    return "toml";
  }

  if (["ini", "cfg", "conf", "cnf"].includes(normalizedExt)) {
    return "ini";
  }

  if (["sh", "bash", "zsh"].includes(normalizedExt)) {
    return "bash";
  }

  if (["xml", "html", "svg"].includes(normalizedExt)) {
    return "xml";
  }

  if (["js", "mjs", "cjs"].includes(normalizedExt)) {
    return "javascript";
  }

  if (["ts", "mts", "cts"].includes(normalizedExt)) {
    return "typescript";
  }

  if (normalizedExt === "sql") {
    return "sql";
  }

  if (!normalizedExt && trimmedContent) {
    try {
      JSON.parse(trimmedContent);
      return "json";
    } catch {
      if (trimmedContent.startsWith("<") && trimmedContent.endsWith(">")) {
        return "xml";
      }

      if (trimmedContent.includes(":") && trimmedContent.includes("\n")) {
        return "yaml";
      }
    }
  }

  return "plaintext";
}

function getLanguageLabel(language: DetectedLanguage) {
  const labels: Record<DetectedLanguage, string> = {
    plaintext: "Plain Text",
    json: "JSON",
    yaml: "YAML",
    toml: "TOML",
    properties: "ENV / Properties",
    ini: "INI / CONF",
    bash: "Shell",
    shell: "Shell",
    nginx: "Nginx",
    xml: "XML / HTML",
    dockerfile: "Dockerfile",
    javascript: "JavaScript",
    typescript: "TypeScript",
    sql: "SQL",
  };

  return labels[language];
}

function formatContent(language: DetectedLanguage, content?: string) {
  const rawContent = content ?? "";

  if (language !== "json") {
    return {
      content: rawContent,
      formatted: false,
    };
  }

  try {
    const parsedContent = JSON.parse(rawContent);
    return {
      content: JSON.stringify(parsedContent, null, 2),
      formatted: true,
    };
  } catch {
    return {
      content: rawContent,
      formatted: false,
    };
  }
}

export function getConfigCodePresentation(
  ext?: string,
  fileName?: string,
  content?: string,
): ConfigCodePresentation {
  const language = resolveDetectedLanguage(ext, fileName, content);
  const formattedResult = formatContent(language, content);
  const resolvedContent = formattedResult.content || "# Empty configuration";

  return {
    language,
    label: getLanguageLabel(language),
    content: resolvedContent,
    lineCount: resolvedContent.split(/\r?\n/).length,
    formatted: formattedResult.formatted,
  };
}
