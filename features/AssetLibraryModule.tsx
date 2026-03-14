
import React, { useState, useEffect } from 'react';
import { SectionTitle, LoadingScan } from '../components/UI';
import { storageService, StoredAsset } from '../services/storageService';
import { LayoutGrid, Maximize2, Trash2, Calendar, Download, Search, Film, Image as ImageIcon, X, Box } from 'lucide-react';

export const AssetLibraryModule = () => {
  const [gallery, setGallery] = useState<StoredAsset[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'image' | 'video' | 'OCTANE'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [fullScreenAsset, setFullScreenAsset] = useState<{url: string, type: 'image' | 'video'} | null>(null);

  useEffect(() => {
    loadGallery();
    
    // Listen for global storage updates (triggered by VisualModule, etc.)
    const handleUpdate = () => loadGallery();
    window.addEventListener('solberus-storage-update', handleUpdate);
    return () => window.removeEventListener('solberus-storage-update', handleUpdate);
  }, []);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const assets = await storageService.getAssets();
      setGallery(assets);
    } catch (e) {
      console.error("Failed to load gallery", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAsset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Permanently delete this asset? This action cannot be undone.")) {
      await storageService.deleteAsset(id);
      loadGallery();
    }
  };

  const handleDownload = (item: StoredAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = item.url;
    a.download = `solberus_${item.type}_${item.id}.png`; 
    if (item.type === 'video') a.download = `solberus_${item.type}_${item.id}.mp4`;
    a.click();
  };

  const filteredGallery = gallery
    .filter(item => {
        let matchesType = true;
        
        if (filterType === 'OCTANE') {
             // Octane filter checks tags specifically
             matchesType = item.tags ? item.tags.includes('OCTANE') : false;
        } else if (filterType !== 'ALL') {
             matchesType = item.type === filterType;
        }

        const matchesSearch = searchQuery === '' || 
                              item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (item.tags && item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
        return matchesType && matchesSearch;
    })
    .sort((a, b) => sortBy === 'NEWEST' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);

  return (
    <div className="h-full flex flex-col bg-slate-950/50">
      <SectionTitle icon={LayoutGrid} title="Asset Library" subtitle="Centralized Visual Archive" />

      {/* Fullscreen Modal */}
      {fullScreenAsset && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setFullScreenAsset(null)}>
            <button className="absolute top-6 right-6 text-slate-400 hover:text-white"><X className="w-8 h-8" /></button>
            <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
                {fullScreenAsset.type === 'video' ? (
                    <video src={fullScreenAsset.url} controls autoPlay className="max-w-[90vw] max-h-[90vh] border border-slate-700 shadow-2xl" />
                ) : (
                    <img src={fullScreenAsset.url} alt="Full Screen" className="max-w-[90vw] max-h-[90vh] object-contain border border-slate-700 shadow-2xl" />
                )}
            </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6 bg-slate-900/50 p-4 border border-slate-800 rounded-lg backdrop-blur-sm">
          <div className="flex gap-4 items-center">
              <div className="flex bg-slate-950 rounded border border-slate-800 p-1">
                  <button onClick={() => setFilterType('ALL')} className={`text-[10px] px-3 py-1.5 font-mono uppercase rounded transition-colors ${filterType === 'ALL' ? 'bg-cyan-900 text-cyan-400' : 'text-slate-500 hover:text-white'}`}>All</button>
                  <button onClick={() => setFilterType('image')} className={`text-[10px] px-3 py-1.5 font-mono uppercase rounded transition-colors ${filterType === 'image' ? 'bg-cyan-900 text-cyan-400' : 'text-slate-500 hover:text-white'}`}>Images</button>
                  <button onClick={() => setFilterType('video')} className={`text-[10px] px-3 py-1.5 font-mono uppercase rounded transition-colors ${filterType === 'video' ? 'bg-cyan-900 text-cyan-400' : 'text-slate-500 hover:text-white'}`}>Videos</button>
                  <button onClick={() => setFilterType('OCTANE')} className={`text-[10px] px-3 py-1.5 font-mono uppercase rounded transition-colors flex items-center gap-1 ${filterType === 'OCTANE' ? 'bg-purple-900 text-purple-300' : 'text-slate-500 hover:text-white'}`}><Box className="w-3 h-3" /> 3D / OCTANE</button>
              </div>
              
              <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="SEARCH PROMPTS / TAGS..." 
                      className="bg-slate-950 border border-slate-800 rounded pl-9 pr-4 py-1.5 text-xs font-mono text-cyan-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 w-64"
                  />
              </div>
          </div>

          <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <select value={sortBy} onChange={(e: any) => setSortBy(e.target.value)} className="bg-slate-950 text-xs font-mono text-slate-400 border border-slate-800 rounded px-2 py-1.5 focus:outline-none uppercase cursor-pointer">
                  <option value="NEWEST">Newest First</option>
                  <option value="OLDEST">Oldest First</option>
              </select>
          </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
              <div className="h-full flex items-center justify-center">
                  <LoadingScan text="LOADING ARCHIVE..." />
              </div>
          ) : filteredGallery.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-50 space-y-4">
                  <LayoutGrid className="w-20 h-20" />
                  <p className="font-mono text-sm uppercase tracking-tighter">No Assets Found in Archive</p>
              </div>
          ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredGallery.map((item) => (
                      <div key={item.id} className="group relative bg-slate-950 border border-slate-800 rounded overflow-hidden hover:border-cyan-500 transition-colors cursor-pointer flex flex-col" onClick={() => setFullScreenAsset({url: item.url, type: item.type})}>
                          <div className="aspect-square relative bg-black overflow-hidden">
                              {item.type === 'video' ? (
                                  <video src={item.url} className="w-full h-full object-cover" />
                              ) : (
                                  <img src={item.url} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              )}
                              
                              {/* Type Badge */}
                              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-mono text-white flex items-center gap-1">
                                  {item.type === 'video' ? <Film className="w-3 h-3 text-purple-400" /> : <ImageIcon className="w-3 h-3 text-cyan-400" />}
                                  <span className="uppercase">{item.type}</span>
                              </div>

                              {/* Overlay Actions */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button onClick={(e) => { e.stopPropagation(); setFullScreenAsset({url: item.url, type: item.type}) }} className="bg-slate-800 text-white p-2 rounded-full hover:bg-cyan-500 hover:text-black transition-colors" title="View Fullscreen"><Maximize2 className="w-4 h-4" /></button>
                                  <button onClick={(e) => handleDownload(item, e)} className="bg-slate-800 text-white p-2 rounded-full hover:bg-green-500 hover:text-black transition-colors" title="Download"><Download className="w-4 h-4" /></button>
                                  <button onClick={(e) => handleDeleteAsset(item.id, e)} className="bg-slate-800 text-white p-2 rounded-full hover:bg-red-500 hover:text-black transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                              </div>
                          </div>
                          
                          <div className="p-3 flex-1 flex flex-col justify-between">
                              <p className="text-[10px] text-slate-300 font-mono line-clamp-2 leading-relaxed mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                  {item.prompt}
                              </p>
                              <div className="flex justify-between items-center mt-auto border-t border-slate-900 pt-2">
                                  <span className="text-[9px] font-mono text-slate-600">{new Date(item.timestamp).toLocaleDateString()}</span>
                                  <div className="flex gap-1">
                                      {item.tags && item.tags.includes('OCTANE') && (
                                          <span className="text-[9px] font-mono text-purple-300 bg-purple-950/30 px-1.5 py-0.5 rounded border border-purple-900/30 flex items-center gap-1">
                                              <Box className="w-2 h-2" /> 3D
                                          </span>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};
