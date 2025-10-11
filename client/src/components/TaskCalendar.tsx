import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User } from "lucide-react";

interface Task {
  id: string;
  title: string;
  date: string;
  time: string;
  assignee: string;
  priority: "high" | "medium" | "low";
}

const tasks: Task[] = [
  { id: "1", title: "Property viewing with Sarah", date: "2024-10-12", time: "10:00 AM", assignee: "John Doe", priority: "high" },
  { id: "2", title: "Contract signing", date: "2024-10-12", time: "2:00 PM", assignee: "Sarah Miller", priority: "high" },
  { id: "3", title: "Follow-up call", date: "2024-10-13", time: "11:00 AM", assignee: "Mike Wilson", priority: "medium" },
];

export function TaskCalendar() {
  const [view, setView] = useState<"list" | "calendar">("list");

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold">Tasks & Schedule</h3>
        <div className="flex gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
            data-testid="button-view-list"
          >
            List
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("calendar")}
            data-testid="button-view-calendar"
          >
            Calendar
          </Button>
        </div>
      </div>

      {view === "list" ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 border rounded-md hover-elevate cursor-pointer"
              data-testid={`card-task-${task.id}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium">{task.title}</h4>
                <Badge
                  variant={task.priority === "high" ? "destructive" : "secondary"}
                >
                  {task.priority}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{task.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{task.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{task.assignee}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Calendar view would display here</p>
        </div>
      )}
    </Card>
  );
}
