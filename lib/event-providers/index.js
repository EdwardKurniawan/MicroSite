const { searchTicketmasterEvents } = require('./ticketmaster');

const PROVIDERS = {
  ticketmaster: {
    name: 'ticketmaster',
    status: 'ready',
    env: ['TICKETMASTER_API_KEY'],
    notes: 'Best first provider for direct event discovery across many cities.',
    search: searchTicketmasterEvents
  },
  predicthq: {
    name: 'predicthq',
    status: 'research',
    env: ['PREDICTHQ_API_KEY'],
    notes: 'Strong paid aggregator for global event coverage and filtering, but not implemented yet.'
  },
  eventbrite: {
    name: 'eventbrite',
    status: 'research',
    env: ['EVENTBRITE_PRIVATE_TOKEN'],
    notes: 'Not implemented for public city discovery because Eventbrite shut down the public event search API in 2019.'
  }
};

function getEventProvider(name) {
  return PROVIDERS[name] || null;
}

function listEventProviders() {
  return Object.values(PROVIDERS).map((provider) => ({
    name: provider.name,
    status: provider.status,
    env: provider.env,
    notes: provider.notes
  }));
}

module.exports = {
  getEventProvider,
  listEventProviders
};
