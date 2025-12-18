import { createRouter } from '@backstage/plugin-auth-backend';
import { Router } from 'express';

// En la función createPlugin o similar:
export default async function createPlugin(env: any) {
  return await createRouter({
    // ... otras configs
    providers: {
      guest: createAuthProviderFactory({ providerId: 'guest' })(env),
    },
    // ... resto
  });
}