import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.08fr_0.92fr]">
      <section
        aria-label="Careerlog workspace"
        className="relative min-h-[38vh] overflow-hidden bg-cover bg-center lg:min-h-screen"
        style={{ backgroundImage: "linear-gradient(180deg, rgb(15 15 24 / 0.12) 5%, rgb(15 15 24 / 0.72) 100%), url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2000&q=88')" }}
      >
        <div className="relative flex min-h-[38vh] flex-col justify-between p-6 text-white sm:p-10 lg:min-h-screen lg:p-14">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-white/15 backdrop-blur-sm"><span className="font-serif text-xl">C</span></div>
            <div><p className="font-serif text-xl">Careerlog</p><p className="font-mono text-[10px] uppercase text-white/70">Private workspace</p></div>
          </div>
          <div className="max-w-xl py-10 lg:py-0">
            <p className="font-mono text-[11px] uppercase text-white/75">A considered search</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">Make room for the next right move.</h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/80 sm:text-base">Applications, conversations, and follow-through. Kept in view, without the noise.</p>
          </div>
          <p className="hidden font-mono text-[10px] uppercase text-white/70 lg:block">One workspace · Every next step</p>
        </div>
      </section>
      <main className="flex min-h-[62vh] items-center justify-center px-6 py-12 sm:px-10 lg:min-h-screen lg:px-14">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
