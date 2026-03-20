/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#7C3AED', // purple
                secondary: '#EC4899', // pink
            }
        },
    },
    plugins: [],
}