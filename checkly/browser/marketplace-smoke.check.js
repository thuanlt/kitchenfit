// Check definition — ONLY checkly/constructs here, no Playwright code
const { BrowserCheck, Frequency } = require('checkly/constructs');
const path = require('path');

new BrowserCheck('marketplace-homepage-browser', {
  name:      '🖥️  Marketplace — Homepage loads',
  activated: true,
  frequency: Frequency.EVERY_30M,
  locations: ['ap-southeast-1'],
  tags:      ['fpt', 'ui', 'smoke'],
  code: {
    entrypoint: path.join(__dirname, 'homepage.spec.js'),
  },
});
