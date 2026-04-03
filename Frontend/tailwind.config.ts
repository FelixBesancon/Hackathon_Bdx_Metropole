import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          forest: "#1b4332",
          deep:   "#2d6a4f",
          mid:    "#52b788",
          light:  "#d8f3dc",
          pale:   "#f0f9f4",
        },
        heat: {
          low:    "#ffffb2",
          medium: "#fd8d3c",
          high:   "#d7191c",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
