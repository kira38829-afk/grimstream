export async function GET(request, { params }) {
    try {
      const path = params.path.join('/');
      const { searchParams } = new URL(request.url);
      
      // Construct the API URL
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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Referer': 'https://hianime.to/',
          },
        });
  
        console.log('📡 Episode API response status:', response.status);
  
        const rawResponse = await response.text(); // Get raw response as text
        console.log('📄 Raw API response:', rawResponse);
  
        if (!response.ok) {
          console.error('❌ Episode API error:', rawResponse);
          throw new Error(`API responded with status: ${response.status}`);
        }
  
        const data = JSON.parse(rawResponse); // Parse JSON after logging
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Normal handling for other endpoints (anime, search, etc.)
      const queryString = searchParams.toString();
      const apiUrl = `${baseUrl}/${path}${queryString ? `?${queryString}` : ''}`;
      
      console.log('🔄 Proxying request to:', apiUrl);
  
      const response = await fetch(apiUrl, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://hianime.to/',
        },
      });
  
      console.log('📡 API response status:', response.status);
  
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
  
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('❌ Proxy error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch data from external API',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }