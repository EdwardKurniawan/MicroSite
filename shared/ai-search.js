/**
 * ai-search.js - Premium AI Search Handler
 * Implements a "WonderGenie" style AI assistant for the city guide.
 */
(function() {
  const searchInput = document.getElementById('hero-search-input');
  const searchButton = document.getElementById('hero-search-button');
  
  if (!searchInput || !searchButton) return;

  // Create AI Result Overlay
  const overlayHTML = `
    <div id="ai-search-overlay" class="fixed inset-0 z-[100] hidden flex items-center justify-center p-4 md:p-8">
      <div class="absolute inset-0 bg-[#02060D]/95 backdrop-blur-xl"></div>
      <div class="glass-card w-full max-w-2xl rounded-[2.5rem] border border-white/10 overflow-hidden relative z-10 animate-in fade-in zoom-in duration-500">
        <div class="p-8 md:p-12">
          <button id="ai-close" class="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          
          <div id="ai-loading" class="text-center py-20">
            <div class="inline-block w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin mb-6"></div>
            <h3 class="font-display text-2xl font-bold text-white mb-2">Analyzing the city...</h3>
            <p class="text-white/40 font-accent tracking-widest text-xs uppercase">WonderGenie is curating your plan</p>
          </div>

          <div id="ai-results" class="hidden">
            <span class="text-gold text-[10px] font-accent font-black tracking-[0.4em] uppercase mb-4 block">AI CURATED PLAN</span>
            <h3 id="ai-summary" class="font-display text-3xl md:text-4xl font-bold text-white mb-8 leading-tight"></h3>
            
            <div id="ai-items" class="space-y-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide">
              <!-- Result cards injected here -->
            </div>

            <div class="mt-10 pt-8 border-t border-white/5 flex justify-center">
              <button id="ai-explore-more" class="glass-pill px-8 py-4 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/20">
                Explore More
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', overlayHTML);

  const overlay = document.getElementById('ai-search-overlay');
  const loading = document.getElementById('ai-loading');
  const results = document.getElementById('ai-results');
  const summaryText = document.getElementById('ai-summary');
  const itemsContainer = document.getElementById('ai-items');
  const closeBtn = document.getElementById('ai-close');

  function showOverlay() {
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    loading.classList.remove('hidden');
    results.classList.add('hidden');
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    showOverlay();

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const city = urlParams.get('city') || window.location.pathname.split('/')[1] || 'amsterdam';

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query, city: city })
      });

      if (!response.ok) throw new Error('AI Search failed');

      const data = await response.json();
      renderResults(data);
    } catch (err) {
      console.error(err);
      summaryText.innerText = "Error: Could not reach the AI guide.";
      loading.classList.add('hidden');
      results.classList.remove('hidden');
    }
  }

  function renderResults(data) {
    summaryText.innerText = data.summary;
    itemsContainer.innerHTML = '';

    (data.items || []).forEach(item => {
      const div = document.createElement('div');
      div.className = 'glass-card p-5 rounded-2xl border border-white/5 flex flex-col gap-2 hover:border-gold/30 transition-all';
      div.innerHTML = `
        <div class="flex justify-between items-start">
          <h4 class="text-white font-bold text-lg">${item.name}</h4>
          <span class="text-gold text-[10px] font-black uppercase tracking-widest font-accent">${item.type || ''}</span>
        </div>
        <p class="text-white/50 text-xs leading-relaxed">${item.reason}</p>
        <a href="/${item.slug}/" class="text-white/30 hover:text-gold text-[10px] font-black uppercase tracking-widest mt-2 transition-colors">View Details →</a>
      `;
      itemsContainer.appendChild(div);
    });

    loading.classList.add('hidden');
    results.classList.remove('hidden');
  }

  searchButton.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
  closeBtn.addEventListener('click', hideOverlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideOverlay();
  });
})();
