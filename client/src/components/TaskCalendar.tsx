import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTaskSchema, type Task, type User as UserType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const taskFormSchema = insertTaskSchema.extend({
  dueDate: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskWithUser extends Task {
  assignedToUser?: UserType;
  createdByUser?: UserType;
}

export function TaskCalendar() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedTask, setSelectedTask] = useState<TaskWithUser | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery<TaskWithUser[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const handleTaskClick = (task: TaskWithUser) => {
    const assignedUser = users.find(u => u.id === task.assignedTo);
    const createdUser = users.find(u => u.id === task.createdBy);
    setSelectedTask({
      ...task,
      assignedToUser: assignedUser,
      createdByUser: createdUser,
    });
    setViewDialogOpen(true);
  };

  const getPriorityVariant = (priority: string): "default" | "destructive" | "secondary" => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      default:
        return "default";
    }
  };

  const formatTaskDate = (date: Date | null) => {
    if (!date) return "No due date";
    return format(new Date(date), "MMM dd, yyyy");
  };

  const formatTaskTime = (date: Date | null) => {
    if (!date) return "";
    return format(new Date(date), "h:mm a");
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading tasks...</div>;
  }

  return (
    <>
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
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tasks found. Create your first task to get started.</p>
              </div>
            ) : (
              tasks.map((task) => {
                const assignedUser = users.find(u => u.id === task.assignedTo);
                return (
                  <div
                    key={task.id}
                    className="p-4 border rounded-md hover-elevate cursor-pointer"
                    data-testid={`card-task-${task.id}`}
                    onClick={() => handleTaskClick(task)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{task.title}</h4>
                      <Badge variant={getPriorityVariant(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatTaskDate(task.dueDate)}</span>
                      </div>
                      {task.dueDate && formatTaskTime(task.dueDate) && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTaskTime(task.dueDate)}</span>
                        </div>
                      )}
                      {assignedUser && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{assignedUser.firstName} {assignedUser.lastName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Calendar view coming soon</p>
          </div>
        )}
      </Card>

      {/* View Task Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>Task Details</DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="mt-1 capitalize">{selectedTask.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Priority</label>
                  <p className="mt-1">
                    <Badge variant={getPriorityVariant(selectedTask.priority)}>
                      {selectedTask.priority}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                  <p className="mt-1">{formatTaskDate(selectedTask.dueDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                  <p className="mt-1">
                    {selectedTask.assignedToUser 
                      ? `${selectedTask.assignedToUser.firstName} ${selectedTask.assignedToUser.lastName}`
                      : "Unassigned"
                    }
                  </p>
                </div>
              </div>
              {selectedTask.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1 text-sm">{selectedTask.description}</p>
                </div>
              )}
              {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Attachments</label>
                  <div className="mt-2 space-y-2">
                    {selectedTask.attachments.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary hover:underline"
                      >
                        Attachment {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
