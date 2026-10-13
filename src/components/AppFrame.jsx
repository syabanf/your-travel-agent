/**
 * AppFrame: the mobile app's column. Full screen on phones; on wider screens
 * a centred max-w-md column on the grey canvas, as a web app rather than a
 * picture of a phone. Children fill it (give the top child `flex-1`).
 */
export default function AppFrame({ children }) {
  return (
    <div className="min-h-dvh bg-surface-2">
      <div
        className="relative mx-auto flex h-dvh w-full max-w-md flex-col bg-surface md:shadow-card"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        {children}
      </div>
    </div>
  );
}
