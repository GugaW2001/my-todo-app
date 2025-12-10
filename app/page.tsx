"use client";

import { useEffect, useState } from "react";

type Task = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  // Load tasks initially and subscribe to SSE for real-time updates
  useEffect(() => {
    // Initial load
    fetch("/api/tasks")
      .then(res => res.json())
      .then(data => setTasks(data || []));

    // SSE subscription
    const eventSource = new EventSource("/api/tasks/sse"); // SSE endpoint
    eventSource.onmessage = (event) => {
      const updatedTask: Task = JSON.parse(event.data);
      setTasks(prev => {
        const exists = prev.find(t => t.id === updatedTask.id);
        if (exists) {
          // Update existing
          return prev.map(t => (t.id === updatedTask.id ? updatedTask : t));
        } else {
          // Add new
          return [updatedTask, ...prev];
        }
      });
    };

    return () => eventSource.close();
  }, []);

  // Add new task
  const addTask = async () => {
    if (!newTitle.trim()) return;

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        description: newDescription,
      }),
    });

    const created = await res.json();
    setTasks(prev => [created, ...prev]);
    setNewTitle("");
    setNewDescription("");
  };

  // Toggle completed
  const toggleComplete = async (task: Task) => {
    const res = await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: task.id,
        title: task.title,
        description: task.description,
        completed: !task.completed,
      }),
    });

    const updated = await res.json();
    setTasks(prev => prev.map(t => (t.id === task.id ? updated : t)));
  };

  // Save edited task
  const saveEdit = async (task: Task) => {
    if (!editingTitle.trim()) return;

    const res = await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: task.id,
        title: editingTitle,
        description: editingDescription,
        completed: task.completed,
      }),
    });

    const updated = await res.json();
    setTasks(prev => prev.map(t => (t.id === task.id ? updated : t)));
    setEditingId(null);
  };

  // Delete task
  const deleteTask = async (task: Task) => {
    const res = await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id }),
    });

    const result = await res.json();
    if (result.success) setTasks(prev => prev.filter(t => t.id !== task.id));
  };

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>My To-Do List</h1>

      {/* Add new task */}
      <div style={{ display: "flex", flexDirection: "column", marginBottom: 20, gap: 10 }}>
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="New task title..."
          style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        />
        <textarea
          value={newDescription}
          onChange={e => setNewDescription(e.target.value)}
          placeholder="Task description..."
          rows={2}
          style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        />
        <button
          onClick={addTask}
          style={{
            padding: "8px 12px",
            borderRadius: 4,
            cursor: "pointer",
            background: "#0070f3",
            color: "white",
          }}
        >
          Add
        </button>
      </div>

      {/* Task list */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {tasks.map(task => (
          <li
            key={task.id}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 14,
              background: "#f9f9f9",
              padding: 12,
              borderRadius: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" checked={task.completed} onChange={() => toggleComplete(task)} />

              {editingId === task.id ? (
                <input
                  value={editingTitle}
                  onChange={e => setEditingTitle(e.target.value)}
                  style={{ padding: 6, flex: 1 }}
                />
              ) : (
                <span
                  style={{
                    textDecoration: task.completed ? "line-through" : "none",
                    fontWeight: 600,
                    flex: 1,
                  }}
                >
                  {task.title}
                </span>
              )}

              {editingId === task.id ? (
                <button onClick={() => saveEdit(task)} style={{ cursor: "pointer" }}>
                  Save
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingId(task.id);
                    setEditingTitle(task.title);
                    setEditingDescription(task.description);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  Edit
                </button>
              )}

              <button onClick={() => deleteTask(task)} style={{ cursor: "pointer", color: "red" }}>
                Delete
              </button>
            </div>

            {/* Description */}
            {editingId === task.id ? (
              <textarea
                value={editingDescription}
                onChange={e => setEditingDescription(e.target.value)}
                rows={2}
                style={{ padding: 6 }}
              />
            ) : (
              <p style={{ margin: 0, opacity: 0.8 }}>{task.description}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
