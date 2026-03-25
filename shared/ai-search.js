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
      <div class="glass-card w-full max-w-2xl rounded-[2.5rem] border border-white/10 overflow-hidden relative z-10 animate-in fade-in zoom-in duration-500 shadow-[0_0_100px_rgba(232,96,28,0.1)]">
        <div class="p-8 md:p-12">
          <button id="ai-close" class="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          
          <div id="ai-loading" class="text-center py-20">
            <div id="ai-spinner" class="inline-block w-12 h-12 border-4 border-white/10 border-t-gold rounded-full animate-spin mb-6"></div>
            <h3 class="font-display text-2xl font-bold text-white mb-2">Architecting your day...</h3>
            <p class="text-white/40 font-accent tracking-widest text-[8px] uppercase">WonderGenie is curating a masterpiece</p>
          </div>

          <div id="ai-results" class="hidden">
            <div class="flex items-center gap-3 mb-6">
              <span class="w-8 h-px bg-white/20"></span>
              <span class="text-gold text-[10px] font-accent font-black tracking-[0.4em] uppercase">CURATED ITINERARY</span>
              <span class="w-8 h-px bg-white/20"></span>
            </div>
            <h3 id="ai-summary" class="font-display text-2xl md:text-4xl font-bold text-white mb-10 leading-tight"></h3>
            
            <div class="relative pl-8 border-l border-white/10 space-y-12 max-h-[45vh] overflow-y-auto pr-4 scrollbar-hide mb-8" id="ai-timeline">
              <!-- Result steps injected here -->
            </div>

            <div class="pt-8 border-t border-white/5 flex flex-col items-center gap-4">
              <button id="ai-explore-more" class="glass-pill px-10 py-5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-gold hover:text-black transition-all border border-white/20 hover:border-gold">
                EXPLORE ALL COLLECTIONS
              </button>
              <p class="text-white/20 text-[8px] font-accent uppercase tracking-widest">Powered by WonderGenie AI</p>
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
  const timelineContainer = document.getElementById('ai-timeline');
  const closeBtn = document.getElementById('ai-close');
  const exploreMoreBtn = document.getElementById('ai-explore-more');
  const overlayCard = overlay.querySelector('.glass-card');

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
      summaryText.innerText = "Error: WonderGenie is currently offline. Please try again soon.";
      loading.classList.add('hidden');
      results.classList.remove('hidden');
    }
  }

  function renderResults(data) {
    // Dynamic theme tinting
    if (data.themeColor) {
      overlayCard.style.boxShadow = `0 0 100px ${data.themeColor}22`;
      document.getElementById('ai-spinner').style.borderTopColor = data.themeColor;
    }

    summaryText.innerText = data.summary;
    timelineContainer.innerHTML = '';

    (data.steps || []).forEach((step, index) => {
      const div = document.createElement('div');
      div.className = 'relative animate-in slide-in-from-bottom-4 duration-700 fill-mode-both';
      div.style.animationDelay = `${index * 150}ms`;

      // Dot helper
      const isTicket = step.type === 'TICKET';
      const dotColor = isTicket ? (data.themeColor || '#E8601C') : 'white';
      
      div.innerHTML = `
        <div class="absolute -left-[41px] top-2 w-4 h-4 rounded-full bg-[#02060D] border-2 flex items-center justify-center transition-all duration-500" style="border-color: ${dotColor}">
          <div class="w-1 h-1 rounded-full ${isTicket ? 'animate-pulse' : ''}" style="background-color: ${dotColor}"></div>
        </div>
        
        <div class="group">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-white/40 font-accent text-[9px] uppercase tracking-widest">${step.time}</span>
            ${isTicket ? '<span class="bg-gold/10 text-gold text-[8px] font-black px-2 py-0.5 rounded border border-gold/20 uppercase tracking-tighter">Skip the Queue</span>' : ''}
          </div>
          
          <h4 class="text-white font-bold text-xl mb-2 group-hover:text-gold transition-colors">${step.name}</h4>
          <p class="text-white/40 text-sm leading-relaxed mb-4 italic font-serif">"${step.description}"</p>
          
          ${step.slug ? `
            <a href="/${step.slug}/" class="inline-flex items-center gap-2 text-white/60 hover:text-gold text-[10px] font-black uppercase tracking-widest transition-all group-hover:translate-x-1">
              ${isTicket ? 'Book Experiences' : 'View Details'} 
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
          ` : ''}
        </div>
      `;
      timelineContainer.appendChild(div);
    });

    loading.classList.add('hidden');
    results.classList.remove('hidden');
  }

  exploreMoreBtn.addEventListener('click', () => {
    window.location.href = '/tours/';
  });

  searchButton.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
  closeBtn.addEventListener('click', hideOverlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideOverlay();
  });
})();
