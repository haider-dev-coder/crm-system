import { MessagingCenter } from "@/components/MessagingCenter";

export default function Messages() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Messaging Center</h1>
        <p className="text-muted-foreground">Unified communications hub</p>
      </div>

      <MessagingCenter />
    </div>
  );
}
