exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { propertyId, requestBody, accessToken } = JSON.parse(event.body);

        console.log(`Fetching GA4 data for property: ${propertyId}`);

        // שימוש ב-fetch המובנה של Node.js 18+
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
            console.error('GA4 API error:', data);
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ 
                    error: 'GA4 API error',
                    details: data.error?.message || 'Unknown error'
                })
            };
        }

        console.log('GA4 data fetched successfully');
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('GA4 data function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to fetch GA4 data',
                details: error.message 
            })
        };
    }
};