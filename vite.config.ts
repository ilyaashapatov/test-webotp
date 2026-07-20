import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/test-webotp/', // Обязательно с косой чертой в начале и конце
  server: {
    port: 3000,       // Запуск на привычном 3000 порту вместо случайного
    open: true,       // Автоматически открывать сайт в браузере при старте
    host: true,       // Позволяет открывать сайт с телефона в той же Wi-Fi сети (удобно для тестирования WebOTP!)
  }
})
