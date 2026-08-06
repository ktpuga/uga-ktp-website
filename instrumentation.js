// Server-side error reporting.

const WEBHOOK = process.env.DISCORD_ERROR_WEBHOOK_URL;

const WINDOW_MS = 5 * 60 * 1000;
const MAX_PER_WINDOW = 10;
const lastSeen = new Map();
let windowStart = 0;
let sentThisWindow = 0;

function shouldReport(signature) {
  const now = Date.now();

  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    sentThisWindow = 0;
    lastSeen.clear();
  }

  if (lastSeen.has(signature)) return false;
  if (sentThisWindow >= MAX_PER_WINDOW) return false;

  lastSeen.set(signature, now);
  sentThisWindow += 1;
  return true;
}

export async function onRequestError(error, request, context) {
  // Always log locally regardless of whether the webhook is configured
  console.error(
    `[error] ${context?.routeType ?? '?'} ${request?.method ?? '?'} ${request?.path ?? '?'}`,
    error
  );

  if (!WEBHOOK) return;

  try {
    const message = error?.message ?? String(error);
    const signature = `${context?.routePath ?? request?.path}|${message}`;
    if (!shouldReport(signature)) return;

    const safePath = String(request?.path ?? 'unknown').split('?')[0];
    const stack = String(error?.stack ?? '').slice(0, 900);

    await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: '🚨 website error',
            color: 15158332,
            description: `\`\`\`\n${message.slice(0, 500)}\n\`\`\``,
            fields: [
              { name: 'Route', value: `\`${safePath}\``, inline: true },
              { name: 'Type', value: context?.routeType ?? 'unknown', inline: true },
              { name: 'Method', value: request?.method ?? 'unknown', inline: true },
            ],
            footer: { text: stack ? stack.split('\n').slice(0, 4).join('\n') : 'no stack' },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch {
    // Reporting must never take down the request that was already failing, and
    // Next logs anything thrown from here as a second error on top of the first.
  }
}
