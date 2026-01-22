// app/watch/[episodeId]/page.js - FIXED & DEFENSIVE
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../../components/Header';
import VideoPlayer from '../../../components/VideoPlayer';
import { api } from '../../../utils/api';

export default function WatchEpisode() {
  const params = useParams();
  const rawEpisodeId = params.episodeId ? decodeURIComponent(params.episodeId) : '';

  const [episodeId, setEpisodeId] = useState(rawEpisodeId);
  const [sources, setSources] = useState([]);
  const [servers, setServers] = useState({ sub: [], dub: [], raw: [] });
  const [episodeInfo, setEpisodeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('sub');
  const [error, setError] = useState(null);
  const [hasServers, setHasServers] = useState(false);

  // Helper: produce alternate episodeId formats to try if needed
  const possibleEpisodeIds = (orig) => {
    const variants = new Set();
    if (!orig) return [];
    variants.add(orig);

    // If it's like "anime-id?ep=1" -> also try "anime-id-1" and "anime-id?ep=01"
    if (orig.includes('?ep=')) {
      variants.add(orig.replace('?ep=', '-')); // anime-id-1
      // padded
      const parts = orig.split('?ep=');
      const num = parts[1];
      if (num && num.length === 1) variants.add(`${parts[0]}?ep=0${num}`);
    } else {
      // If it's "anime-id-1" -> also try "anime-id?ep=1"
      const dashMatch = orig.match(/(.+)-(\d+)$/);
      if (dashMatch) {
        variants.add(`${dashMatch[1]}?ep=${dashMatch[2]}`);
      }
    }

    // ensure encoding
    return Array.from(variants).map((v) => encodeURIComponent(v) === v ? v : decodeURIComponent(v));
  };

  useEffect(() => {
    setEpisodeId(rawEpisodeId);
  }, [rawEpisodeId]);

  useEffect(() => {
    const fetchEpisodeData = async () => {
      try {
        setLoading(true);
        setError(null);
        setHasServers(false);
        setSources([]);
        setServers({ sub: [], dub: [], raw: [] });

        console.log('🎬 Episode ID from URL (raw):', rawEpisodeId);
        if (!episodeId || episodeId === 'undefined') {
          throw new Error('Invalid episode ID');
        }

        // We'll try multiple episodeId shapes to maximize chance of success
        const attempts = possibleEpisodeIds(episodeId);
        console.log('🧪 Episode ID attempts:', attempts);

        let serversData = null;
        let usedEpisodeId = null;

        // Try to get servers for each episode id variant
        for (const attempt of attempts) {
          try {
            console.log(`🔎 Trying servers with animeEpisodeId = "${attempt}"`);
            const result = await api.getEpisodeServers(attempt);
            // result may be the payload (servers) or an object containing data; we assume fetchAPI normalized it to payload already.
            if (result && (result.sub || result.dub || result.raw)) {
              serversData = result;
              usedEpisodeId = attempt;
              console.log('📡 Servers found for attempt:', attempt, serversData);
              break;
            }
            // Some APIs return nested shape: { data: { sub: ... } } - handle defensively
            if (result && result.data && (result.data.sub || result.data.dub || result.data.raw)) {
              serversData = result.data;
              usedEpisodeId = attempt;
              console.log('📡 Servers found nested for attempt:', attempt, serversData);
              break;
            }
            console.log('⚠️ No servers returned for attempt:', attempt);
          } catch (err) {
            console.warn(`⚠️ getEpisodeServers failed for attempt ${attempt}:`, err.message || err);
            continue;
          }
        }

        if (!serversData) {
          throw new Error('No streaming servers available for this episode (tried multiple ID formats).');
        }

        // use the successful episode id variant going forward (unencoded form)
        setEpisodeId(decodeURIComponent(usedEpisodeId));

        // Normalize servers object shape
        const normalizedServers = {
          sub: Array.isArray(serversData.sub) ? serversData.sub : [],
          dub: Array.isArray(serversData.dub) ? serversData.dub : [],
          raw: Array.isArray(serversData.raw) ? serversData.raw : [],
          episodeNo: serversData.episodeNo || serversData.episode || serversData.ep || null,
        };

        setServers(normalizedServers);
        setHasServers(normalizedServers.sub.length > 0 || normalizedServers.dub.length > 0 || normalizedServers.raw.length > 0);

        // Determine initial category order to try
        const categoriesToTry = ['sub', 'dub', 'raw'];

        // Try each category and each server within it until we find sources
        let sourcesFound = null;
        let foundServerName = null;
        let foundCategory = null;

        for (const category of categoriesToTry) {
          const list = normalizedServers[category] || [];
          for (const server of list) {
            // server can have { serverName, serverId, ... }. Try both serverName and serverId if needed.
            const serverIdentifiers = [];
            if (server.serverName) serverIdentifiers.push(server.serverName);
            if (server.serverId) serverIdentifiers.push(server.serverId);
            // dedupe
            const ids = Array.from(new Set(serverIdentifiers));

            for (const idToTry of ids) {
              try {
                console.log(`🔄 Trying sources for server="${idToTry}" category="${category}" episode="${usedEpisodeId}"`);
                // call api
                const sourcesResp = await api.getEpisodeSources(usedEpisodeId, idToTry, category);

                // different APIs can return different shapes. Normalize:
                let payload = sourcesResp;
                if (payload && payload.data) payload = payload.data;
                // some endpoints return { sources: [...] } or just an array
                let candidateSources = [];
                if (Array.isArray(payload)) candidateSources = payload;
                else if (payload && Array.isArray(payload.sources)) candidateSources = payload.sources;
                else if (payload && Array.isArray(payload.data)) candidateSources = payload.data;

                console.log(`🎥 Server "${idToTry}" returned ${candidateSources.length} sources (category: ${category})`);

                if (candidateSources.length > 0) {
                  sourcesFound = candidateSources;
                  foundServerName = idToTry;
                  foundCategory = category;
                  break;
                }
              } catch (err) {
                console.warn(`❌ Server ${idToTry} failed for category ${category}:`, err.message || err);
                // continue to next server identifier
                continue;
              }
            } // ids loop

            if (sourcesFound) break;
          } // server loop

          if (sourcesFound) break;
        } // category loop

        if (!sourcesFound) {
          throw new Error('No video sources found on any server. This episode might not be available for streaming yet.');
        }

        // success
        setSources(sourcesFound);
        setSelectedServer(foundServerName || '');
        setSelectedCategory(foundCategory || 'sub');
        setEpisodeInfo({
          episodeId: usedEpisodeId,
          episodeNo: normalizedServers.episodeNo || 'Unknown',
          title: `Episode ${normalizedServers.episodeNo || 'Unknown'}`,
        });

        console.log('✅ Sources set. Server:', foundServerName, 'Category:', foundCategory);
      } catch (err) {
        console.error('❌ Error fetching episode data:', err);
        setError(err.message || 'Failed to load episode data');
      } finally {
        setLoading(false);
      }
    };

    if (episodeId) {
      fetchEpisodeData();
    } else {
      setLoading(false);
      setError('No episode ID provided');
    }
  }, [episodeId]);

  const handleServerChange = async (serverIdentifier, category) => {
    setSelectedServer(serverIdentifier);
    setSelectedCategory(category);
    setLoading(true);
    setError(null);

    try {
      console.log(`🔄 Changing to server: ${serverIdentifier}, category: ${category}`);
      const result = await api.getEpisodeSources(episodeId, serverIdentifier, category);

      let payload = result;
      if (payload && payload.data) payload = payload.data;

      let candidateSources = [];
      if (Array.isArray(payload)) candidateSources = payload;
      else if (payload && Array.isArray(payload.sources)) candidateSources = payload.sources;
      else if (payload && Array.isArray(payload.data)) candidateSources = payload.data;

      if (!candidateSources || candidateSources.length === 0) {
        throw new Error('No video sources available for this server');
      }

      setSources(candidateSources);
    } catch (err) {
      console.error('Error changing server:', err);
      setError(`Failed to load from ${serverIdentifier} (${category}): ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-gray-400">Loading episode data...</p>
            <p className="text-gray-500 text-sm mt-2">Episode ID: {episodeId}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
            <h3 className="text-red-400 font-bold mb-2">Unable to Load Episode</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Episode Info */}
        <div className="bg-secondary rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            {episodeInfo?.title || 'Episode Not Loaded'}
          </h1>
          <p className="text-gray-400">Episode ID: {episodeInfo?.episodeId || episodeId}</p>
          {episodeInfo && (
            <p className="text-gray-400 text-sm mt-1">
              Currently playing: {selectedServer} ({selectedCategory})
            </p>
          )}
        </div>

        {/* Video Player */}
        <div className="mb-8">
          {sources.length > 0 ? (
            <VideoPlayer sources={sources} />
          ) : hasServers && (
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-8 text-center">
              <p className="text-yellow-400 text-lg mb-2">Ready to Stream</p>
              <p className="text-yellow-300 text-sm">Select a server below to start streaming</p>
            </div>
          )}
        </div>

        {/* Server Selection */}
        {hasServers && (
          <div className="bg-secondary rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Select Server & Language</h3>

            {/* Sub Servers */}
            {servers.sub && servers.sub.length > 0 && (
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-green-400 mb-2">Subtitled (Sub)</h4>
                <div className="flex flex-wrap gap-2">
                  {servers.sub.map((server) => {
                    const id = server.serverName || server.serverId || JSON.stringify(server);
                    return (
                      <button
                        key={`sub-${id}`}
                        onClick={() => handleServerChange(id, 'sub')}
                        className={`px-4 py-2 rounded transition-colors ${
                          selectedServer === id && selectedCategory === 'sub'
                            ? 'bg-accent text-white'
                            : 'bg-primary text-gray-300 hover:bg-gray-700'
                        }`}
                        disabled={loading}
                      >
                        {server.serverName || server.serverId || 'Unknown'}
                        {loading && selectedServer === id && <span className="ml-2 animate-spin">⟳</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dub Servers */}
            {servers.dub && servers.dub.length > 0 && (
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-blue-400 mb-2">Dubbed (Dub)</h4>
                <div className="flex flex-wrap gap-2">
                  {servers.dub.map((server) => {
                    const id = server.serverName || server.serverId || JSON.stringify(server);
                    return (
                      <button
                        key={`dub-${id}`}
                        onClick={() => handleServerChange(id, 'dub')}
                        className={`px-4 py-2 rounded transition-colors ${
                          selectedServer === id && selectedCategory === 'dub'
                            ? 'bg-accent text-white'
                            : 'bg-primary text-gray-300 hover:bg-gray-700'
                        }`}
                        disabled={loading}
                      >
                        {server.serverName || server.serverId || 'Unknown'}
                        {loading && selectedServer === id && <span className="ml-2 animate-spin">⟳</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Raw Servers */}
            {servers.raw && servers.raw.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-yellow-400 mb-2">Raw</h4>
                <div className="flex flex-wrap gap-2">
                  {servers.raw.map((server) => {
                    const id = server.serverName || server.serverId || JSON.stringify(server);
                    return (
                      <button
                        key={`raw-${id}`}
                        onClick={() => handleServerChange(id, 'raw')}
                        className={`px-4 py-2 rounded transition-colors ${
                          selectedServer === id && selectedCategory === 'raw'
                            ? 'bg-accent text-white'
                            : 'bg-primary text-gray-300 hover:bg-gray-700'
                        }`}
                        disabled={loading}
                      >
                        {server.serverName || server.serverId || 'Unknown'}
                        {loading && selectedServer === id && <span className="ml-2 animate-spin">⟳</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-900/20 border border-gray-700 rounded-lg p-4 mt-8">
            <h4 className="text-gray-400 font-bold mb-2">Debug Info</h4>
            <div className="text-sm text-gray-500 space-y-1">
              <p>Episode ID: {episodeId}</p>
              <p>Has Servers: {hasServers ? 'Yes' : 'No'}</p>
              <p>Sources Available: {sources.length}</p>
              <p>Selected Server: {selectedServer || 'None'}</p>
              <p>Selected Category: {selectedCategory}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
