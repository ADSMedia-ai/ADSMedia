import * as core from '@actions/core';

interface SendEmailResponse {
  success: boolean;
  data: {
    message_id: string;
    send_id: number;
    to: string;
    from: string;
    server: string;
    status: string;
  };
  timestamp: string;
}

async function run(): Promise<void> {
  try {
    const apiKey = core.getInput('api-key', { required: true });
    const to = core.getInput('to', { required: true });
    const subject = core.getInput('subject', { required: true });
    const html = core.getInput('html');
    const text = core.getInput('text');
    const toName = core.getInput('to-name');
    const fromName = core.getInput('from-name');
    const replyTo = core.getInput('reply-to');
    const serverId = core.getInput('server-id');

    if (!html && !text) {
      throw new Error('Either html or text content is required');
    }

    const body: Record<string, unknown> = {
      to,
      subject,
    };

    if (html) body.html = html;
    if (text) body.text = text;
    if (toName) body.to_name = toName;
    if (fromName) body.from_name = fromName;
    if (replyTo) body.reply_to = replyTo;
    if (serverId) body.server_id = parseInt(serverId, 10);

    core.info(`Sending email to ${to}...`);

    const response = await fetch('https://api.adsmedia.live/v1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json() as SendEmailResponse;

    if (!response.ok || !data.success) {
      throw new Error(`API Error: ${JSON.stringify(data)}`);
    }

    core.info(`Email sent successfully!`);
    core.info(`Message ID: ${data.data.message_id}`);
    core.info(`Send ID: ${data.data.send_id}`);
    core.info(`Status: ${data.data.status}`);

    core.setOutput('message-id', data.data.message_id);
    core.setOutput('send-id', data.data.send_id);
    core.setOutput('status', data.data.status);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unexpected error occurred');
    }
  }
}

run();

