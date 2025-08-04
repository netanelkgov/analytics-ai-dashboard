import { Config } from "@netlify/functions";

export default async (request, context) => {
  // הגדרת CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    console.log('📊 GA4 Data function called');
    
    const { propertyId, requestBody, accessToken } = await request.json();

    if (!propertyId || !requestBody || !accessToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🔍 Fetching GA4 data for property: ${propertyId}`);

    // קריאה ל-GA4 API
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ GA4 API error:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      
      return new Response(
        JSON.stringify({
          error: 'GA4 API error',
          details: data.error?.message || 'Unknown error',
          status: response.status
        }),
        {
          status: response.status,
          headers: { ...headers, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ GA4 data fetched successfully');
    console.log(`📈 Rows returned: ${data.rows?.length || 0}`);
    
    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 GA4 data function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch GA4 data',
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
  path: "/ga4-data"
};
