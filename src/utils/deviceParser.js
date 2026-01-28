const UAParser = require('ua-parser-js');

function parseUserAgent(userAgentString) {
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  const deviceType = getDeviceType(result);

  return {
    deviceType,
    browser: result.browser.name || 'Unknown',
    browserVersion: result.browser.version || null,
    os: result.os.name || 'Unknown',
    osVersion: result.os.version || null,
    device: result.device.model || null,
    vendor: result.device.vendor || null,
  };
}

function getDeviceType(result) {
  const deviceType = result.device.type;

  if (deviceType === 'mobile') return 'mobile';
  if (deviceType === 'tablet') return 'tablet';
  if (deviceType === 'smarttv') return 'smart-tv';
  if (deviceType === 'wearable') return 'wearable';
  if (deviceType === 'console') return 'console';

  // Default to desktop if no device type detected
  return 'desktop';
}

module.exports = { parseUserAgent };
