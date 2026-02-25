type LogLevel = "debug" | "info" | "warn" | "error";

const priority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const activeLevel = (process.env.LOG_LEVEL ?? "info") as LogLevel;

const canLog = (level: LogLevel) => priority[level] >= priority[activeLevel];

function sanitize(payload: unknown) {
  const text = JSON.stringify(payload);
  return text
    .replaceAll(/"password"\s*:\s*"[^"]*"/gi, '"password":"***"')
    .replaceAll(/"token"\s*:\s*"[^"]*"/gi, '"token":"***"');
}

function print(level: LogLevel, message: string, meta?: unknown) {
  if (!canLog(level)) return;
  const prefix = `[${new Date().toISOString()}][${level.toUpperCase()}]`;
  if (!meta) {
    console[level === "debug" ? "log" : level](`${prefix} ${message}`);
    return;
  }
  console[level === "debug" ? "log" : level](`${prefix} ${message} ${sanitize(meta)}`);
}

export const logger = {
  debug: (message: string, meta?: unknown) => print("debug", message, meta),
  info: (message: string, meta?: unknown) => print("info", message, meta),
  warn: (message: string, meta?: unknown) => print("warn", message, meta),
  error: (message: string, meta?: unknown) => print("error", message, meta)
};
