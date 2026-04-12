// Normalize input from Webhook node
// n8n Webhook node โดยปกติจะให้ { body, headers, query, params }
// แต่เผื่อกรณี payload ถูก map ขึ้นมาบน root ก็รองรับทั้งสองแบบ

const items = $input.all();
if (items.length === 0) {
  return [{ json: { error: 'No input items from Webhook' } }];
}

const raw = items[0].json || {};
const payload = (raw.body && typeof raw.body === 'object') ? raw.body : raw;

// Extract fields with sane defaults
const project   = String(payload.project ?? payload.job ?? 'unknown-project');
const stage     = String(payload.stage   ?? 'unknown-stage');
const status    = String(payload.status  ?? 'unknown');
const build     = String(payload.build   ?? payload.buildNumber ?? 'n/a');
const image     = String(payload.image   ?? 'n/a');
const container = String(payload.container ?? 'n/a');
const url       = String(payload.url     ?? 'http://localhost:3000/');
const timestamp = payload.timestamp ? new Date(payload.timestamp).toISOString() : new Date().toISOString();

// Small helpers
const emoji = status.toLowerCase() === 'success' ? '✅'
            : status.toLowerCase() === 'failed'  ? '❌'
            : 'ℹ️';

const lines = [
  `${emoji} Deploy ${status.toUpperCase()}: ${project} (${stage})`,
  `Build: ${build}`,
  `Image: ${image}`,
  `Container: ${container}`,
  `URL: ${url}`,
  `Time: ${timestamp}`
];
const slackText = lines.join('\n');

// Optional: Slack Block Kit (ถ้าคุณจะ map ไปใช้กับ Slack node แบบ Blocks)
const slackBlocks = [
  {
    type: 'header',
    text: { type: 'plain_text', text: `${emoji} ${project} – ${stage}` }
  },
  { type: 'divider' },
  {
    type: 'section',
    fields: [
      { type: 'mrkdwn', text: `*Status:*\n${status.toUpperCase()}` },
      { type: 'mrkdwn', text: `*Build:*\n${build}` },
      { type: 'mrkdwn', text: `*Image:*\n${image}` },
      { type: 'mrkdwn', text: `*Container:*\n${container}` },
      { type: 'mrkdwn', text: `*URL:*\n${url}` },
      { type: 'mrkdwn', text: `*Time:*\n${timestamp}` }
    ]
  }
];

// Return a single normalized item
return [{
  json: {
    // raw webhook data (for debugging)
    _webhook: raw,

    // normalized
    project, stage, status, build, image, container, url, timestamp,

    // for Slack node
    slack: {
      text: slackText,
      blocks: slackBlocks
    }
  }
}];