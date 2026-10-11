import type { MetadataRoute } from "next";

/** Lets a learner "add to home screen": full-screen, no browser bar, opens straight into their session. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Excavation",
    short_name: "Excavation",
    description: "Know Thy Self measures. The Excavation interprets. School Edition.",
    start_url: "/learn",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a101c",
    theme_color: "#0a101c",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
