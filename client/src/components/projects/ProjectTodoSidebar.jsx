import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Square, Plus, Loader2 } from "lucide-react";
import { useAddTodo, useUpdateTodo } from "@/hooks/useProjects";
import { toast } from "sonner";

export default function ProjectTodoSidebar({ project }) {
  const addTodo = useAddTodo();
  const updateTodo = useUpdateTodo();
  const [newTask, setNewTask] = useState("");

  if (!project) return null;

  const todos = project.todos || [];
  const pending = todos.filter((t) => t.status !== "done");
  const done = todos.filter((t) => t.status === "done");

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    addTodo.mutate(
      { projectId: project._id, task: newTask.trim() },
      {
        onSuccess: () => {
          toast.success("Todo added");
          setNewTask("");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed"),
      }
    );
  };

  const toggleDone = (todo) => {
    const newStatus = todo.status === "done" ? "pending" : "done";
    updateTodo.mutate(
      { projectId: project._id, todoId: todo._id, status: newStatus },
      {
        onError: (err) => toast.error(err.response?.data?.message || "Failed"),
      }
    );
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Todo List</span>
          <Badge variant="outline" className="text-xs">
            {pending.length} left
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <form onSubmit={handleAdd} className="flex gap-1">
          <Input
            placeholder="Add task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="h-8 text-xs"
          />
          <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={addTodo.isPending}>
            {addTodo.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
          </Button>
        </form>

        <div className="max-h-80 space-y-1 overflow-y-auto">
          {pending.map((todo) => (
            <button
              key={todo._id}
              type="button"
              onClick={() => toggleDone(todo)}
              className="flex w-full items-start gap-2 rounded-md p-1.5 text-left hover:bg-muted"
            >
              <Square className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-xs leading-tight">{todo.task}</p>
                {todo.assignee && (
                  <p className="text-[10px] text-muted-foreground">
                    {todo.assignee.name || todo.assignee}
                  </p>
                )}
              </div>
              {todo.isWBS && (
                <Badge variant="outline" className="ml-auto shrink-0 text-[10px] px-1 py-0">
                  WBS
                </Badge>
              )}
            </button>
          ))}

          {done.length > 0 && (
            <>
              <div className="pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Completed ({done.length})
              </div>
              {done.map((todo) => (
                <button
                  key={todo._id}
                  type="button"
                  onClick={() => toggleDone(todo)}
                  className="flex w-full items-start gap-2 rounded-md p-1.5 text-left opacity-60 hover:bg-muted"
                >
                  <CheckSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="text-xs leading-tight line-through">{todo.task}</p>
                </button>
              ))}
            </>
          )}

          {todos.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No tasks yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
