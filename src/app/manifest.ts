import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "NykStack AI Lead Finder", short_name: "Lead Finder", description: "Personal Malaysian lead research dashboard.", start_url: "/", display: "standalone", background_color: "#080808", theme_color: "#080808", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] };
}
