import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

/**
 * Vite 插件：将 node_modules 中的 vendor UMD 文件复制到 public/vendor/，
 * 使 iframe / 新窗口预览可以通过 <script src> 按需加载，无需外部 CDN。
 */
function copyVendorPlugin(): Plugin {
  const vendorDir = resolve(__dirname, 'public/vendor');
  const files = [
    {
      src: 'node_modules/html2canvas/dist/html2canvas.min.js',
      dest: 'html2canvas.min.js',
    },
    {
      src: 'node_modules/jspdf/dist/jspdf.umd.min.js',
      dest: 'jspdf.umd.min.js',
    },
    {
      src: 'node_modules/html2pdf.js/dist/html2pdf.bundle.min.js',
      dest: 'html2pdf.bundle.min.js',
    },
  ];

  return {
    name: 'copy-vendor',
    buildStart() {
      if (!existsSync(vendorDir)) {
        mkdirSync(vendorDir, { recursive: true });
      }
      for (const { src, dest } of files) {
        copyFileSync(resolve(__dirname, src), resolve(vendorDir, dest));
      }
    },
  };
}

export default defineConfig({
  base: '/markdowneditor/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [copyVendorPlugin()],
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['marked', 'dompurify'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 4173,
  },
});
