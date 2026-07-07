import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { createLocalBase44Client } from './localDataStore';

const { appId, token, functionsVersion, appBaseUrl } = appParams;
const forceRemoteBase44 = import.meta.env.VITE_USE_BASE44 === 'true';
const shouldUseLocalFallback = !forceRemoteBase44 && (import.meta.env.DEV || !appId || !appBaseUrl);

const createBase44Client = () => {
  if (shouldUseLocalFallback) {
    return createLocalBase44Client();
  }

  return createClient({
    appId,
    token,
    functionsVersion,
    serverUrl: '',
    requiresAuth: false,
    appBaseUrl,
  });
};

export const base44 = createBase44Client();

