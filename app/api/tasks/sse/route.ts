import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Lista de clientes SSE
let clients: any[] = [];

// Função para broadcast de tarefas
export function broadcastTask(task: any) {
  clients.forEach((client) => {
    try {
      client.write(`data: ${JSON.stringify(task)}\n\n`);
    } catch (e) {
      console.error("Erro ao enviar SSE:", e);
    }
  });
}

// GET all tasks
export async function GET() {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// SSE endpoint
export async function STREAM(req: Request) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  clients.push(writer);

  req.signal.addEventListener("abort", () => {
    clients = clients.filter((c) => c !== writer);
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// POST new task
export async function POST(req: Request) {
  const body = await req.json();
  const { title, description } = body;

  const { data, error } = await supabase
    .from("tasks")
    .insert([{ title, description: description ?? "", completed: false }])
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  broadcastTask(data); // envia SSE
  return NextResponse.json(data);
}

// PUT update task
export async function PUT(req: Request) {
  const body = await req.json();
  const { id, title, description, completed } = body;

  const { data, error } = await supabase
    .from("tasks")
    .update({ title, description: description ?? "", completed })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  broadcastTask(data); // envia SSE
  return NextResponse.json(data);
}

// DELETE task
export async function DELETE(req: Request) {
  const body = await req.json();
  const { id } = body;

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notifica remoção (opcional: pode enviar um evento SSE com id removido)
  broadcastTask({ id, deleted: true });

  return NextResponse.json({ success: true });
}
