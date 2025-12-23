import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // 루트를 현재 폴더로 설정 (index.html 위치)
  root: '.',
  
  // 개발 서버 설정
  server: {
    port: 5173,
    open: true,  // 브라우저 자동 열기
    cors: true
  },
  
  // 빌드 설정
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  
  // 정적 파일 경로 해결
  resolve: {
    alias: {
      '@': resolve(__dirname, 'js'),
      '@css': resolve(__dirname, 'css'),
      '@components': resolve(__dirname, 'js/components')
    }
  }
});
