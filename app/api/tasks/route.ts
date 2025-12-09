import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET all tasks
export async function GET() {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST a new task
export async function POST(req: Request) {
  const body = await req.json();
  const { data, error } = await supabase
    .from("tasks")
    .insert([{ title: body.title, completed: false }])
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PUT to update a task
export async function PUT(req: Request) {
  const body = await req.json();
  const { data, error } = await supabase
    .from("tasks")
    .update({ title: body.title, completed: body.completed })
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE a task
export async function DELETE(req: Request) {
  const body = await req.json();
  const { id } = body;

  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
