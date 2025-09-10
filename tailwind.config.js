/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      transitionProperty: {
        position: "left, top, transform",
      },
      transitionDuration: {
        1000: "1000ms",
      },
      transitionTimingFunction: {
        move: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      animation: {
        "gradient-xy": "gradient 6s linear infinite",
        "border-glow": "borderGlow 4s ease-in-out infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "float-subtle": "float 3s ease-in-out infinite",
        "pulse-subtle": "pulse 2s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite",
      },
      keyframes: {
        gradient: {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "left center",
            "background-image":
              "linear-gradient(115deg, transparent, transparent, rgba(59,130,246,0.2), transparent, transparent)",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
            "background-image":
              "linear-gradient(115deg, transparent, transparent, rgba(59,130,246,0.2), transparent, transparent)",
          },
        },
        borderGlow: {
          "0%, 100%": {
            "border-color": "rgba(255,255,255,0.03)",
          },
          "50%": {
            "border-color": "rgba(59,130,246,0.2)",
          },
        },
        fadeIn: {
          "0%": {
            opacity: "0",
            transform: "translate(-50%, -100%)",
          },
          "100%": {
            opacity: "1",
            transform: "translate(-50%, 0)",
          },
        },
        float: {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(-10px)",
          },
        },
        pulse: {
          "0%, 100%": {
            opacity: "1",
            transform: "scale(1)",
          },
          "50%": {
            opacity: "0.85",
            transform: "scale(0.98)",
          },
        },
        glow: {
          "0%, 100%": {
            opacity: "0",
          },
          "50%": {
            opacity: "0.5",
          },
        },
      },
    },
  },
  plugins: [],
};
