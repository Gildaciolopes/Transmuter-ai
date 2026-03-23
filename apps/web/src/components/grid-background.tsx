"use client";

export function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated grid */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0 animate-grid-flow"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            height: "200%",
          }}
        />
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px] animate-pulse-glow" />
      <div
        className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] animate-pulse-glow"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-cyan-500/8 blur-[100px] animate-pulse-glow"
        style={{ animationDelay: "4s" }}
      />
    </div>
  );
}
