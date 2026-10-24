import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Placeholder entry screen. The capture → review → output → approve flow is
// built on top of this by the experience lane.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-12">
      <Alert>
        <AlertTitle>Prototype — use a made-up story</AlertTitle>
        <AlertDescription>
          This is a hackathon test build. Please don&apos;t enter real testimony, names or church details.
        </AlertDescription>
      </Alert>
      <h1 className="text-3xl font-semibold tracking-tight">Tell your story. Choose what to share.</h1>
      <p className="text-muted-foreground">
        Speak or type a few words about your baptism, review them, and decide who receives the result.
      </p>
    </main>
  );
}
