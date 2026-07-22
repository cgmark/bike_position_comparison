import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/bike_position_comparison/',
  plugins: [react()],
})
