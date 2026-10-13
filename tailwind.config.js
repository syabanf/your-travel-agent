/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        // Older screens use font-display / font-body; both are the same DM Sans stack.
        display: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Borderless AI replies lean entirely on type and rhythm, so give the
      // markdown a deliberate scale instead of the plugin's article defaults.
      typography: () => ({
        chat: {
          css: {
            "--tw-prose-body": "#0F1A15",
            "--tw-prose-headings": "#0F1A15",
            "--tw-prose-bold": "#0F1A15",
            "--tw-prose-bullets": "rgba(207, 28, 34,0.45)",
            "--tw-prose-hr": "rgba(6, 52, 36,0.10)",
            "--tw-prose-quotes": "#5E6B65",
            "--tw-prose-quote-borders": "rgba(207, 28, 34,0.30)",
            "--tw-prose-th-borders": "rgba(6, 52, 36,0.14)",
            "--tw-prose-td-borders": "rgba(6, 52, 36,0.07)",
            fontSize: "0.9375rem",
            lineHeight: "1.7",
            "> :first-child": { marginTop: "0" },
            "> :last-child": { marginBottom: "0" },
            p: { marginTop: "0.85em", marginBottom: "0.85em" },
            // Day headings carry the structure — make them unmistakable.
            "h1, h2, h3": {
              fontSize: "1rem",
              fontWeight: "700",
              letterSpacing: "-0.01em",
              marginTop: "1.6em",
              marginBottom: "0.6em",
              paddingBottom: "0.4em",
              borderBottom: "1px solid rgba(6, 52, 36,0.08)",
            },
            "ul, ol": { marginTop: "0.6em", marginBottom: "0.9em", paddingLeft: "1.15em" },
            li: { marginTop: "0.3em", marginBottom: "0.3em", paddingLeft: "0.15em" },
            "li::marker": { fontSize: "0.85em" },
            strong: { fontWeight: "600" },
            em: { color: "#5E6B65", fontStyle: "normal", fontSize: "0.9em" },
            a: { color: "#CF1C22", textDecoration: "underline", textUnderlineOffset: "2px" },
            code: {
              backgroundColor: "rgba(6, 52, 36,0.05)",
              padding: "0.15em 0.4em",
              borderRadius: "6px",
              fontWeight: "500",
            },
            "code::before": { content: '""' },
            "code::after": { content: '""' },
            table: { fontSize: "0.875rem", marginTop: "1em", marginBottom: "1em" },
            "thead th": { fontWeight: "600", paddingBottom: "0.6em" },
            "tbody td": { paddingTop: "0.6em", paddingBottom: "0.6em" },
            blockquote: { fontStyle: "normal", fontWeight: "400", paddingLeft: "1em" },
            hr: { marginTop: "1.6em", marginBottom: "1.6em" },
          },
        },
      }),
  		// WIT semantic tokens. Values live as RGB channels in index.css so the
  		// /opacity modifiers work; the palette comes from the Icon Holiday logo.
  		borderRadius: {
  			card: '1.5rem',
  			hero: '1.75rem',
  			pill: '9999px',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			card: 'var(--shadow-card)',
  			float: 'var(--shadow-float)',
  			glow: 'var(--shadow-glow)',
  			up: 'var(--shadow-up)'
  		},
  		colors: {
  			accent: {
  				DEFAULT: 'rgb(var(--c-accent) / <alpha-value>)',
  				strong: 'rgb(var(--c-accent-strong) / <alpha-value>)',
  				dark: 'rgb(var(--c-accent-dark) / <alpha-value>)',
  				soft: 'rgb(var(--c-accent-soft) / <alpha-value>)',
  				foreground: 'rgb(255 255 255 / <alpha-value>)'
  			},
  			ink: {
  				DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
  				2: 'rgb(var(--c-ink-2) / <alpha-value>)',
  				3: 'rgb(var(--c-ink-3) / <alpha-value>)'
  			},
  			'on-ink': {
  				DEFAULT: 'rgb(255 255 255 / <alpha-value>)',
  				muted: 'rgb(var(--c-on-ink-muted) / <alpha-value>)'
  			},
  			highlight: {
  				DEFAULT: 'rgb(var(--c-highlight) / <alpha-value>)',
  				soft: 'rgb(var(--c-highlight-soft) / <alpha-value>)'
  			},
  			surface: {
  				DEFAULT: 'rgb(var(--c-surface) / <alpha-value>)',
  				2: 'rgb(var(--c-surface-2) / <alpha-value>)'
  			},
  			card: {
  				DEFAULT: 'rgb(255 255 255 / <alpha-value>)',
  				foreground: 'rgb(var(--c-foreground) / <alpha-value>)'
  			},
  			border: 'rgb(var(--c-border) / <alpha-value>)',
  			silver: 'rgb(var(--c-silver) / <alpha-value>)',
  			muted: {
  				DEFAULT: 'rgb(var(--c-muted) / <alpha-value>)',
  				foreground: 'rgb(var(--c-muted) / <alpha-value>)'
  			},
  			body: 'rgb(var(--c-body) / <alpha-value>)',
  			foreground: 'rgb(var(--c-foreground) / <alpha-value>)',
  			info: {
  				DEFAULT: 'rgb(var(--c-info) / <alpha-value>)',
  				soft: 'rgb(var(--c-info-soft) / <alpha-value>)'
  			},
  			success: {
  				DEFAULT: 'rgb(var(--c-success) / <alpha-value>)',
  				soft: 'rgb(var(--c-success-soft) / <alpha-value>)'
  			},
  			warning: {
  				DEFAULT: 'rgb(var(--c-warning) / <alpha-value>)',
  				soft: 'rgb(var(--c-warning-soft) / <alpha-value>)'
  			},
  			danger: {
  				DEFAULT: 'rgb(var(--c-accent) / <alpha-value>)',
  				soft: 'rgb(var(--c-accent-soft) / <alpha-value>)'
  			},
  			'chart-muted': 'rgb(var(--c-chart-muted) / <alpha-value>)',
  			// shadcn/ui names, pointed at the same ladder so vendored components match.
  			background: 'rgb(var(--c-surface) / <alpha-value>)',
  			popover: {
  				DEFAULT: 'rgb(255 255 255 / <alpha-value>)',
  				foreground: 'rgb(var(--c-foreground) / <alpha-value>)'
  			},
  			primary: {
  				DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
  				foreground: 'rgb(255 255 255 / <alpha-value>)'
  			},
  			secondary: {
  				DEFAULT: 'rgb(var(--c-surface-2) / <alpha-value>)',
  				foreground: 'rgb(var(--c-foreground) / <alpha-value>)'
  			},
  			destructive: {
  				DEFAULT: 'rgb(var(--c-accent-strong) / <alpha-value>)',
  				foreground: 'rgb(255 255 255 / <alpha-value>)'
  			},
  			input: 'rgb(var(--c-border) / <alpha-value>)',
  			ring: 'rgb(var(--c-accent) / <alpha-value>)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' }
        }
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-up': 'fade-up 0.5s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.4s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}