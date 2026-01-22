// app/api/test-episode-format/route.js
export async function GET(request) {
    try {
      const { searchParams } = new URL(request.url);
      const animeId = searchParams.get('animeId');
      
      if (!animeId) {
        return new Response(JSON.stringify({ error: 'animeId parameter required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
  
      // Get episodes for this anime
      const episodesResponse = await fetch(`https://aniwatch-api.vercel.app/api/v2/hianime/anime/${animeId}/episodes`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
          'Referer': 'https://hianime.to/',
        },
      });
  
      if (!episodesResponse.ok) {
        throw new Error(`Failed to get episodes: ${episodesResponse.status}`);
      }
  
      const episodesData = await episodesResponse.json();
      const episodes = episodesData.data?.episodes || episodesData.episodes || [];
      
      // Test each episode format
      const testResults = [];
      
      for (const episode of episodes.slice(0, 3)) { // Test first 3 episodes
        const episodeId = episode.episodeId || episode.id;
        
        if (!episodeId) continue;
        
        // Test different formats
        const testFormats = [
          episodeId, // Original format
          `${animeId}?ep=${episode.number || episode.episodeNum}`, // Constructed format
          `${animeId}?ep=${episodeId.split('?ep=')[1]}`, // Extract ep number
        ];
        
        for (const format of testFormats) {
          if (!format) continue;
          
          try {
            const testUrl = `https://aniwatch-api.vercel.app/api/v2/hianime/episode/servers?animeEpisodeId=${format}`;
            console.log('Testing:', testUrl);
            
            const response = await fetch(testUrl, {
              headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'Referer': 'https://hianime.to/',
              },
            });
            
            testResults.push({
              episodeNumber: episode.number,
              originalId: episodeId,
              testFormat: format,
              status: response.status,
              success: response.ok,
              episodeData: episode
            });
            
            if (response.ok) {
              console.log('✅ Working format found:', format);
              // Found a working format, return it
              const serversData = await response.json();
              return new Response(JSON.stringify({
                success: true,
                workingFormat: format,
                episode: episode,
                servers: serversData
              }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              });
            }
          } catch (error) {
            testResults.push({
              episodeNumber: episode.number,
              originalId: episodeId,
              testFormat: format,
              error: error.message
            });
          }
        }
      }
      
      return new Response(JSON.stringify({
        success: false,
        message: 'No working format found',
        testResults: testResults,
        episodesSample: episodes.slice(0, 3)
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }