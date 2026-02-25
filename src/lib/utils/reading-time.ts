import readingTime from "reading-time";

export function calculateReadingTime(content: string) {
  return Math.max(1, Math.ceil(readingTime(content).minutes));
}
