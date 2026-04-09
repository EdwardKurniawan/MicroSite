function buildTrackedBookingUrl({
  slug,
  citySlug,
  tiqetsProductId,
  partnerUrl,
  externalBookingUrl,
  internalOfferUrl,
  provider,
  source = 'city-guide'
}) {
  const destination =
    internalOfferUrl ||
    partnerUrl ||
    externalBookingUrl ||
    buildLegacyTiqetsUrl({ tiqetsProductId, citySlug });

  if (!destination) {
    return null;
  }

  const resolvedProvider =
    provider ||
    inferProvider({ internalOfferUrl, partnerUrl, externalBookingUrl, tiqetsProductId });

  const params = new URLSearchParams();
  if (slug) params.set('slug', slug);
  params.set('redirect', destination);
  if (citySlug) params.set('city', citySlug);
  if (resolvedProvider) params.set('provider', resolvedProvider);
  if (source) params.set('source', source);

  return `/api/track-click?${params.toString()}`;
}

function getBookingLabel(provider) {
  switch (provider) {
    case 'ticketpass':
      return 'See Tickets';
    case 'internal':
      return 'See Offer';
    case 'partner':
    case 'tiqets':
      return 'Check Availability';
    default:
      return 'Check Availability';
  }
}

function inferProvider({
  internalOfferUrl,
  partnerUrl,
  externalBookingUrl,
  tiqetsProductId
}) {
  if (internalOfferUrl) return 'internal';
  if (providerLooksLikeTicketpass(partnerUrl) || providerLooksLikeTicketpass(externalBookingUrl)) {
    return 'ticketpass';
  }
  if (partnerUrl || externalBookingUrl) return 'partner';
  if (tiqetsProductId) return 'tiqets';
  return 'external';
}

function providerLooksLikeTicketpass(url) {
  return typeof url === 'string' && /ticketpass\.co/i.test(url);
}

function buildLegacyTiqetsUrl({ tiqetsProductId, citySlug }) {
  if (!tiqetsProductId) {
    return null;
  }

  return `https://www.tiqets.com/en/product/${tiqetsProductId}/?partner=${citySlug}_insider`;
}

module.exports = {
  buildTrackedBookingUrl,
  getBookingLabel
};
