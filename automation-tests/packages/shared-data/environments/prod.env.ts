import type { EnvConfig } from '@fpt-automation/core';

export const prodConfig: Record<string, EnvConfig> = {
  marketplace: {
    baseUrl:  'https://marketplace.fptcloud.com/en',
    apiUrl:   'https://mkp-api.fptcloud.com',
    apiKey:   process.env.MKP_API_KEY ?? '',
    username: process.env.FPT_USERNAME ?? '',
    password: process.env.FPT_PASSWORD ?? '',
  },
  'fpt-ai': {
    baseUrl:  'https://ai.fptcloud.com',
    apiUrl:   'https://mkp-api.fptcloud.com',
    apiKey:   process.env.MKP_API_KEY ?? '',
    username: process.env.FPT_USERNAME ?? '',
    password: process.env.FPT_PASSWORD ?? '',
  },
  'portal-v2': {
    baseUrl:  'https://portal.fptcloud.com',
    username: process.env.PORTAL_USERNAME ?? '',
    password: process.env.PORTAL_PASSWORD ?? '',
  },
  billing: {
    baseUrl:  'https://billing.fptcloud.com',
    apiKey:   process.env.BILLING_API_KEY ?? '',
    username: process.env.FPT_USERNAME ?? '',
    password: process.env.FPT_PASSWORD ?? '',
  },
};
