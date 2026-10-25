import type { Metadata } from "next";
import { Flow } from "@/components/flow/flow";

// A direct link for churches and events: starts on the testimony path.
export const metadata: Metadata = {
  title: "Share your testimony",
  description: "Tell your testimony in your own words and choose who receives it.",
};

export default function TestimonyPage() {
  return <Flow path="testimony" />;
}
