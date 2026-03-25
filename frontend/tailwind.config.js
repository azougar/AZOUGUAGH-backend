/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          discord_blue: '#5865f2',
          discord_black: '#36393f',
          discord_grey: '#2f3136',
          discord_chat: '#36393f',
        }
      },
    },
    plugins: [],
  }