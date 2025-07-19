module.exports = {
  plugins: [
    require('@tailwindcss/postcss'), // Dit is de nieuwe, correcte manier
    require('autoprefixer'),
  ],
};