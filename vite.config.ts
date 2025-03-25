import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0", // Permite acesso de qualquer dispositivo na rede local
    port: 8080,
    strictPort: false, // Permite tentar portas alternativas se 8080 estiver ocupada
    cors: true, // Habilita CORS para permitir requisições de outros dispositivos
    hmr: {
      // Configuração para Hot Module Replacement funcionar melhor em rede
      clientPort: 8080, // Porta que o cliente tentará conectar
      overlay: true, // Mostra erros como overlay
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
