import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.landwer.stockit',
  appName: 'Stock-It לנדוור',
  webDir: 'dist',
  android: { allowMixedContent: true },
  ios: { contentInset: 'automatic' },
};

export default config;
