/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      // Borderless AI replies lean entirely on type and rhythm, so give the
      // markdown a deliberate scale instead of the plugin's article defaults.
      typography: () => ({
        chat: {
          css: {
            "--tw-prose-body": "#0B1B3B",
            "--tw-prose-headings": "#0B1B3B",
            "--tw-prose-bold": "#0B1B3B",
            "--tw-prose-bullets": "rgba(173,31,35,0.45)",
            "--tw-prose-hr": "rgba(11,27,59,0.10)",
            "--tw-prose-quotes": "#46566F",
            "--tw-prose-quote-borders": "rgba(173,31,35,0.30)",
            "--tw-prose-th-borders": "rgba(11,27,59,0.14)",
            "--tw-prose-td-borders": "rgba(11,27,59,0.07)",
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
              borderBottom: "1px solid rgba(11,27,59,0.08)",
            },
            "ul, ol": { marginTop: "0.6em", marginBottom: "0.9em", paddingLeft: "1.15em" },
            li: { marginTop: "0.3em", marginBottom: "0.3em", paddingLeft: "0.15em" },
            "li::marker": { fontSize: "0.85em" },
            strong: { fontWeight: "600" },
            em: { color: "#46566F", fontStyle: "normal", fontSize: "0.9em" },
            a: { color: "#AD1F23", textDecoration: "underline", textUnderlineOffset: "2px" },
            code: {
              backgroundColor: "rgba(11,27,59,0.05)",
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
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  		background: 'hsl(var(--background))',
  		foreground: 'hsl(var(--foreground))',
  		  mora: {
  		    'deep-blue': '#05308C',
  		    'lobster-red': '#AD1F23',
  		    'steel-marine': '#0B1B3B',
  		    'claw-cream': '#FBFAF5',
  		    primary: '#0B1B3B',
  		    gold: '#AD1F23',
  		    neutral: '#5A6B85',
  		    white: '#0B1B3B',
  		    green: '#05308C',
  		  },
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
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