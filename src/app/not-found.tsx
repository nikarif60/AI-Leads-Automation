import Link from "next/link";
export default function NotFound() { return <div className="empty-state full-page"><h1>Lead not found</h1><p>This record may have been removed or placed in the cooldown list.</p><Link className="primary-button" href="/leads">Return to leads</Link></div>; }
