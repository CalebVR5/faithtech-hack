import type { Metadata } from "next";
import { Flow } from "@/components/flow/flow";

// A direct link for churches and baptism events: starts on the baptism path.
export const metadata: Metadata = {
  title: "Share your baptism story",
  description: "Tell your baptism story in your own words and choose who receives it.",
};

export default function BaptismPage() {
  return <Flow path="baptism" />;
}
