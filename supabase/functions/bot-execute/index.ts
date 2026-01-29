/**
 * Supabase Edge Function: bot-execute
 *
 * Exécuté par cron toutes les 4 heures via Supabase Cron
 *
 * Configuration cron (dans Supabase Dashboard):
 * Schedule: Every 4 hours (0 star-slash-4 star star star)
 * HTTP Request: POST
 * URL: https://your-project.supabase.co/functions/v1/bot-execute
 */


import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    // Appeler la route API Next.js qui contient toute la logique
    const nextApiUrl = Deno.env.get('NEXT_PUBLIC_URL') || 'https://bot-polymarket-kappa.vercel.app';
    const response = await fetch(`${nextApiUrl}/api/bot/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: response.status,
    });
  } catch (error) {
    console.error('Edge Function error:', error);

    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
