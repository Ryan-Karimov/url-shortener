const geoip = require('geoip-lite');

const geoService = {
  lookup(ip) {
    // Handle localhost and private IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return {
        country: 'Local',
        city: 'Local',
        region: null,
        timezone: null,
        ll: null,
      };
    }

    const geo = geoip.lookup(ip);

    if (!geo) {
      return {
        country: 'Unknown',
        city: 'Unknown',
        region: null,
        timezone: null,
        ll: null,
      };
    }

    return {
      country: geo.country || 'Unknown',
      city: geo.city || 'Unknown',
      region: geo.region || null,
      timezone: geo.timezone || null,
      ll: geo.ll || null,
    };
  },
};

module.exports = geoService;
