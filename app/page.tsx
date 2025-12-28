import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-2xl p-4">
        <div className="h-[400px] mb-4 border rounded-md p-2">
          Chat messages here
        </div>
        <div className="flex gap-2">
          <Input placeholder="Ask something..." />
          <Button>Send</Button>
        </div>
      </Card>
    </main>
  );
}
