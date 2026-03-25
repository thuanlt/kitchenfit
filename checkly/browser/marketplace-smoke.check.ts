/**
 * marketplace-smoke.check.ts
 * Browser check — Playwright chạy mỗi 30 phút từ Singapore
 * Verify homepage load + model list visible
 */

import { BrowserCheck, Frequency } from 'checkly/constructs';
import * as path from 'path';

new BrowserCheck('marketplace-homepage-browser', {
  name:        '🖥️  Marketplace — Homepage loads',
  activated:   true,
  frequency:   Frequency.EVERY_30M,
  locations:   ['ap-southeast-1'],
  tags:        ['fpt', 'ui', 'smoke'],
  code: {
    entrypoint: path.join(__dirname, 'homepage.spec.ts'),
  },
});
