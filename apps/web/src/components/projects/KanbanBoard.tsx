"use client";

import * as React from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { useTaskStore } from "@/store/task.store";
import { KanbanColumn } from "./KanbanColumn";
import { Task, TaskStatus } from "@/types/task.types";

interface KanbanBoardProps {
  onTaskClick: (task: Task) => void;
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
  { id: "blocked", title: "Blocked" },
];

export function KanbanBoard({ onTaskClick }: KanbanBoardProps) {
  const { tasks, moveTask } = useTaskStore();
  const [isMounted, setIsMounted] = React.useState(false);

  // Avoid hydration mismatch with DnD
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a valid droppable area
    if (!destination) return;

    // Dropped in the same column and position
    if (destination.droppableId === source.droppableId && destination.index === source.index)
      return;

    // Find the task and update it
    moveTask(draggableId, destination.droppableId as TaskStatus, destination.index);
  };

  if (!isMounted) return null;

  return (
    <div className="flex h-full w-full gap-6 overflow-x-auto pb-4 pt-2">
      <DragDropContext onDragEnd={handleDragEnd}>
        {COLUMNS.map((col) => {
          const columnTasks = tasks
            .filter((t) => t.status === col.id)
            .sort((a, b) => a.position - b.position);

          return (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={columnTasks}
              onTaskClick={onTaskClick}
            />
          );
        })}
      </DragDropContext>
    </div>
  );
}
