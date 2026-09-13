"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="empty-state full-page"><h1>The research terminal needs attention</h1><p>Your saved leads are safe. Try loading this view again.</p><button className="primary-button" onClick={reset}>Try again</button></div>; }
