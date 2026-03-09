// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react()
  ]
});


    // VitePWA({
    //   strategies: 'injectManifest', // allows to inject custom service worker
    //   srcDir: 'public',          // folder that holds serviceworker.js
    //   filename: 'serviceworker.js',

    //   registerType: 'autoUpdate',
    //   injectRegister: 'auto',  
      
    //   devOptions: { 
    //     enabled: true,
    //     type:'module'
    //   },
    //   manifest: false
    // })