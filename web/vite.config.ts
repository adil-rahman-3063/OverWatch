import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allow iPhone on same Wi-Fi to access http://<YOUR_PC_IP>:5173
    port: 5173,
  },
});
