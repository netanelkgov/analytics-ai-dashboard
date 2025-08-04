import { Config } from "@netlify/functions";

export default async (request, context) => {
  // הגדרת CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // טיפול ב-preflight requests
  if (request.method === 'OPTIONS') {
    return new Response('', {
      status: 200,
      headers
    });
  }

  // רק POST requests מותרים
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      {
        status: 405,
        headers: { ...headers, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    console.log('🔐 GA4 Auth function called');
    
    const { code, type } = await request.json();

    if (type === 'exchange_token') {
      console.log('🔄 Exchanging authorization code for access token');
      
      // החלפת קוד ב-access token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: Netlify.env.get('GOOGLE_CLIENT_ID'),
          client_secret: Netlify.env.get('GOOGLE_CLIENT_SECRET'),
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: Netlify.env.get('REDIRECT_URI')
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('❌ OAuth error:', data);
        return new Response(
          JSON.stringify({
            error: data.error_description || data.error
          }),
          {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' }
          }
        );
      }
      
      console.log('✅ Token exchange successful');
      return new Response(
        JSON.stringify(data),
        {
          status: 200,
          headers: { ...headers, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request type' }),
      {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 Auth function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' }
      }
    );
  }
};

export const config = {
  path: "/ga4-auth"
};
