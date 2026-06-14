import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        background2: "var(--bg2)",
        background3: "var(--bg3)",
        background4: "var(--bg4)",
        border: "var(--border)",
        "border-md": "var(--border-md)",
        "border-hover": "var(--border-hover)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        "btn-bg": "var(--btn-bg)",
        "btn-text": "var(--btn-text)",
        "tag-bg": "var(--tag-bg)",
        "input-bg": "var(--input-bg)",
        "dropdown-bg": "var(--dropdown-bg)",
        "overlay-bg": "var(--overlay-bg)",
      },
    },
  },
  plugins: [],
};
export default config;