import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KinzSuite",
    short_name: "KinzSuite",
    description: "A cozy shared world for you, your partner, and your pets.",
    start_url: "/",
    display: "standalone",
    background_color: "#3FB8E8",
    theme_color: "#3FB8E8",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
