import { apiError, apiOk } from "@/lib/utils/api";
import { generateCode, saveShortCodeToken } from "@/lib/auth/security";

function makeCaptchaSvg(text: string) {
  const chars = text.split("");
  const width = 160;
  const height = 52;
  const noise = Array.from({ length: 6 }, (_, i) => {
    const y = 8 + i * 7;
    return `<line x1="0" y1="${y}" x2="${width}" y2="${y + (i % 2 === 0 ? 8 : -8)}" stroke="rgba(120,140,170,0.28)" stroke-width="1" />`;
  }).join("");
  const body = chars
    .map((ch, i) => {
      const x = 18 + i * 28;
      const y = 34 + (i % 2 === 0 ? 2 : -2);
      const rotate = (i % 2 === 0 ? -8 : 7) + i;
      return `<text x="${x}" y="${y}" transform="rotate(${rotate} ${x} ${y})" font-size="24" font-family="monospace" fill="#1f2937">${ch}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" rx="10" ry="10" fill="#eef6ff"/>
    ${noise}
    ${body}
  </svg>`;
}

export async function GET() {
  try {
    const captchaId = crypto.randomUUID();
    const answer = generateCode(5);
    await saveShortCodeToken(`captcha:${captchaId}`, answer, 5);
    const svg = makeCaptchaSvg(answer);
    return apiOk({ captchaId, svg });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Captcha generation failed", 500);
  }
}
