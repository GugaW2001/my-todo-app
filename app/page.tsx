"use client";

import { useEffect, useState } from "react";

type Task = {
  id: string;
  title: string;
  completed: boolean;
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // Load tasks
  useEffect(() => {
    fetch("/api/tasks")
      .then(res => res.json())
      .then(data => setTasks(data || []));
  }, []);

  // Add task
  const addTask = async () => {
    if (!newTask.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTask }),
    });
    const created = await res.json();
    setTasks([created, ...tasks]);
    setNewTask("");
  };

  // Toggle completed
  const toggleComplete = async (task: Task) => {
    const res = await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, title: task.title, completed: !task.completed }),
    });
    const updated = await res.json();
    setTasks(tasks.map(t => (t.id === task.id ? updated : t)));
  };

  // Save edited task
  const saveEdit = async (task: Task) => {
    if (!editingText.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, title: editingText, completed: task.completed }),
    });
    const updated = await res.json();
    setTasks(tasks.map(t => (t.id === task.id ? updated : t)));
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
    if (result.success) setTasks(tasks.filter(t => t.id !== task.id));
  };

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>My To-Do List</h1>

      {/* Add new task */}
      <div style={{ display: "flex", marginBottom: 20 }}>
        <input
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder="New task..."
          style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        />
        <button onClick={addTask} style={{ marginLeft: 10, padding: "8px 12px", borderRadius: 4, cursor: "pointer", background: "#0070f3", color: "white" }}>Add</button>
      </div>

      {/* Task list */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {tasks.map(task => (
          <li key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, background: "#f9f9f9", padding: 8, borderRadius: 4 }}>
            <input type="checkbox" checked={task.completed} onChange={() => toggleComplete(task)} />

            {editingId === task.id ? (
              <>
                <input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  style={{ padding: 6, flex: 1 }}
                />
                <button onClick={() => saveEdit(task)} style={{ cursor: "pointer" }}>Save</button>
              </>
            ) : (
              <>
                <span style={{ textDecoration: task.completed ? "line-through" : "none", flex: 1 }}>
                  {task.title}
                </span>
                <button onClick={() => { setEditingId(task.id); setEditingText(task.title); }} style={{ cursor: "pointer" }}>Edit</button>
              </>
            )}

            <button onClick={() => deleteTask(task)} style={{ cursor: "pointer", color: "red" }}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
