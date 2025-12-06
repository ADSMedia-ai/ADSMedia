/**
 * ADSMedia Supabase Edge Function
 * Send emails via ADSMedia API
 * 
 * Deploy: supabase functions deploy send-email
 * 
 * Environment: ADSMEDIA_API_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const API_BASE_URL = 'https://api.adsmedia.live/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendEmailRequest {
  to: string;
  toName?: string;
  subject: string;
  html?: string;
  text?: string;
  fromName?: string;
  replyTo?: string;
  serverId?: number;
}

interface BatchEmailRequest {
  recipients: Array<{ email: string; name?: string }>;
  subject: string;
  html: string;
  text?: string;
  preheader?: string;
  fromName?: string;
  serverId?: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ADSMEDIA_API_KEY');
    if (!apiKey) {
      throw new Error('ADSMEDIA_API_KEY not configured');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'send';

    let endpoint: string;
    let body: Record<string, unknown>;

    if (action === 'batch') {
      // Batch sending
      const data: BatchEmailRequest = await req.json();
      
      if (!data.recipients || !data.subject || !data.html) {
        throw new Error('Missing required fields: recipients, subject, html');
      }

      endpoint = '/send/batch';
      body = {
        recipients: data.recipients,
        subject: data.subject,
        html: data.html,
        text: data.text,
        preheader: data.preheader,
        from_name: data.fromName,
        server_id: data.serverId,
      };
    } else if (action === 'ping') {
      // Test connection
      const response = await fetch(`${API_BASE_URL}/ping`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      const result = await response.json();
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Single email
      const data: SendEmailRequest = await req.json();
      
      if (!data.to || !data.subject || (!data.html && !data.text)) {
        throw new Error('Missing required fields: to, subject, and html or text');
      }

      endpoint = '/send';
      body = {
        to: data.to,
        to_name: data.toName,
        subject: data.subject,
        html: data.html,
        text: data.text,
        from_name: data.fromName,
        reply_to: data.replyTo,
        server_id: data.serverId,
      };
    }

    // Make API request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      status: response.ok ? 200 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

