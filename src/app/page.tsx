import { Flow } from "@/components/flow/flow";

// The whole capture → review → output → approve → share flow runs client-side
// against the app's own API; drafts stay in memory (see AppProvider).
export default function Home() {
  return <Flow />;
}
