import React from "react";

export default function Home() {
  return (
    <div className="relative h-screen">
      {/* Hero Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
        <div className="max-w-3xl text-center">
          <h1 className="mb-8 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-slate-900">
            Your Next Great <span className="text-sky-900">Project</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-700">
            Build modern and beautiful websites with this collection of stunning
            background patterns. Perfect for landing pages, apps, and
            dashboards.
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            <button className="rounded-lg px-6 py-3 font-medium bg-sky-800 text-white hover:bg-sky-900 border-2 border-slate-900 hover:shadow-md ease-in-out transition-all">
              Get Started
            </button>
            <button className="rounded-lg border-2 px-6 py-3 font-medium border-slate-900 bg-slate-100 text-slate-900 hover:bg-slate-200 hover:shadow-md ease-in-out transition-all">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
