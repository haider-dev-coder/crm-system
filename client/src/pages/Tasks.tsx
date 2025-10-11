import { TaskCalendar } from "@/components/TaskCalendar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Tasks() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Tasks & Calendar</h1>
          <p className="text-muted-foreground">Manage your schedule and tasks</p>
        </div>
        <Button data-testid="button-add-task">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      <TaskCalendar />
    </div>
  );
}
