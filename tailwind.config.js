// OFICIAL GUIDE VERSION
// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   // NOTE: Update this to include the paths to all of your component files.
//   content: ["./app/**/*.{js,jsx,ts,tsx}"],
//   presets: [require("nativewind/preset")],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }


// CHAT GPT VERSION
// tailwind.config.js

module.exports = {
	content: [
		"./App.{js,jsx,ts,tsx}",
		"./screens/**/*.{js,jsx,ts,tsx}",
		"./components/**/*.{js,jsx,ts,tsx}",
	],
	theme: {
		extend: {
			fontFamily: {
				montserrat: ['Montserrat', 'Montserrat Italic']
			},
			colors: {
				primary: '#FF3F4D',
				secondary: {
					DEFAULT: '#1C0708',
					foreground: '#4F4F4F',
				},
				light: '#E5E5E5',
				background: {
					DEFAULT: '#F1F1F1',
					foreground: '#D9D9D9'
				}
			}
		},
	},
	plugins: [],
}