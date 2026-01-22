// app/api/anime/[...path]/route.js - UPDATED WITH PROPER HEADERS
export async function GET(request, { params }) {
  try {
    const path = params.path.join('/');
    const { searchParams } = new URL(request.url);
    
    console.log('🔄 Proxy Request:', { 
      path, 
      searchParams: Object.fromEntries(searchParams) 
    });

    const baseUrl = 'https://aniwatch-api.vercel.app/api/v2/hianime';
    
    // For ALL episode endpoints, use special handling
    if (path.startsWith('episode/')) {
      // Get the raw query string to preserve the ?ep= in animeEpisodeId
      const originalUrl = new URL(request.url);
      const rawQueryString = originalUrl.search.substring(1); // Remove the leading ?
      
      const apiUrl = `${baseUrl}/${path}?${rawQueryString}`;
      console.log('🎬 Episode API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Referer': 'https://hianime.to/',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
        },
        // Add timeout
        signal: AbortSignal.timeout(15000),
      });

      console.log('📡 External API response status:', response.status);
      console.log('📡 External API response headers:', Object.fromEntries(response.headers));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ External API error:', errorText);
        return new Response(JSON.stringify({ 
          success: false, 
          error: `External API error: ${response.status}`,
          details: errorText
        }), { 
          status: response.status,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
          }
        });
      }

      const data = await response.json();
      
      // Return in the expected format: { success: true, data: ... }
      return new Response(JSON.stringify({ 
        success: true, 
        data: data 
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
          'X-API-Source': 'aniwatch-proxy'
        }
      });
    }
    
    // Normal handling for other endpoints (anime, search, etc.)
    const queryString = searchParams.toString();
    const apiUrl = `${baseUrl}/${path}${queryString ? `?${queryString}` : ''}`;
    
    console.log('🔗 Normal API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://hianime.to/',
      },
      signal: AbortSignal.timeout(15000),
    });

    console.log('📡 API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ External API error:', errorText);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `External API error: ${response.status}`,
        details: errorText
      }), { 
        status: response.status,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const data = await response.json();
    
    // Return in the expected format: { success: true, data: ... }
    return new Response(JSON.stringify({ 
      success: true, 
      data: data 
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
      }
    });
    
  } catch (error) {
    console.error('❌ Proxy error:', error);
    
    // Handle specific error types
    let statusCode = 500;
    let errorMessage = 'Failed to fetch data from external API';
    
    if (error.name === 'TimeoutError') {
      statusCode = 504;
      errorMessage = 'External API timeout - please try again later';
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      statusCode = 503;
      errorMessage = 'Network error - cannot connect to external API';
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      message: error.message
    }), {
      status: statusCode,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}