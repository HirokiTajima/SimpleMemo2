"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
};

const LS_KEY = "simplememo.notes.v9";
type Screen = "list" | "edit";

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString() + " " + new Date(ts).toLocaleTimeString();
const extractTitle = (content: string) => {
  const firstLine = (content ?? "").split(/\r?\n/)[0] || "Untitled";
  return (firstLine.trim().slice(0, 40) || "Untitled");
};

const loadNotes = (): Note[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Note[];
    return arr.map((n) => ({
      ...n,
      title: n.title ?? extractTitle(n.content),
    }));
  } catch {
    return [];
  }
};
const saveNotes = (notes: Note[]) =>
  localStorage.setItem(LS_KEY, JSON.stringify(notes));

export default function Page() {
  return <App />;
}

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("list");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);

  useEffect(() => {
    setNotes(loadNotes());
  }, []);
  useEffect(() => saveNotes(notes), [notes]);

  const selected = useMemo(
    () => notes.find((n) => n.id === selectedId) || null,
    [notes, selectedId]
  );

  function createNote() {
    const now = Date.now();
    const n: Note = {
      id: uid(),
      title: "Untitled",
      content: "",
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [n, ...prev]);
    setSelectedId(n.id);
    setScreen("edit");
  }

  function updateNoteContent(content: string) {
    if (!selected) return;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selected.id
          ? {
              ...n,
              content,
              title: extractTitle(content),
              updatedAt: Date.now(),
            }
          : n
      )
    );
  }

  function requestDelete(id: string) {
    setConfirmTargetId(id);
    setConfirmOpen(true);
  }
  function confirmDelete() {
    if (!confirmTargetId) return;
    setNotes((prev) => prev.filter((n) => n.id !== confirmTargetId));
    if (selectedId === confirmTargetId) setSelectedId(null);
    setConfirmTargetId(null);
    setConfirmOpen(false);
  }
  function cancelDelete() {
    setConfirmTargetId(null);
    setConfirmOpen(false);
  }

  return (
    <div className="h-screen w-full flex flex-col bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-10 text-center font-semibold text-lg p-4 bg-white shadow-md">
        SimpleMemo
      </header>

      <main className="flex-1 min-h-0">
        {screen === "list" ? (
          <ListScreen
            notes={notes}
            onCreate={createNote}
            onOpen={(id) => {
              setSelectedId(id);
              setScreen("edit");
            }}
            onRequestDelete={requestDelete}
          />
        ) : (
          <EditScreen
            selected={selected}
            onChange={updateNoteContent}
            onBack={() => setScreen("list")}
          />
        )}
      </main>

      {/* Bottom bar: only List + New */}
      <nav className="sticky bottom-0 bg-white border-t flex justify-around py-2 shadow-inner">
        <button
          className="flex flex-col items-center text-sm text-neutral-700"
          onClick={() => setScreen("list")}
        >
          📋 <span>List</span>
        </button>
        <button
          className="flex flex-col items-center text-sm text-neutral-700"
          onClick={createNote}
        >
          ➕ <span>New</span>
        </button>
      </nav>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          onClick={(e) => {
            if (e.currentTarget === e.target) cancelDelete();
          }}
        >
          <div className="w-72 bg-white rounded-2xl shadow-lg p-4">
            <div className="font-semibold text-lg mb-2">Delete note?</div>
            <div className="text-sm text-neutral-600 mb-4">
              This cannot be undone.
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 py-2 border rounded-xl"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2 border rounded-xl text-red-600"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ListScreen({
  notes,
  onCreate,
  onOpen,
  onRequestDelete,
}: {
  notes: Note[];
  onCreate: () => void;
  onOpen: (id: string) => void;
  onRequestDelete: (id: string) => void;
}) {
  return (
    <div className="h-full overflow-auto p-3 space-y-3">
      {notes.map((n) => (
        <div key={n.id} className="rounded-2xl bg-white shadow p-4">
          <div className="font-medium text-base">{n.title}</div>
          <div className="text-xs text-neutral-500 truncate mt-1">
            {n.content.replace(/\n/g, " ")}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">
            {formatDate(n.updatedAt)}
          </div>
          <div className="mt-3 flex justify-end gap-3">
            <button
              className="px-3 py-1 rounded-lg border border-neutral-400 text-neutral-800 text-sm"
              onClick={() => onOpen(n.id)}
            >
              Open
            </button>
            <button
              className="px-3 py-1 rounded-lg border border-neutral-400 text-red-600 text-sm"
              onClick={() => onRequestDelete(n.id)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
      {notes.length === 0 && (
        <div className="text-center text-neutral-500 mt-20">
          No notes yet. Tap ➕ New to start.
        </div>
      )}
    </div>
  );
}

function EditScreen({
  selected,
  onChange,
  onBack,
}: {
  selected: Note | null;
  onChange: (v: string) => void;
  onBack: () => void;
}) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    editorRef.current?.focus();
  }, [selected?.id]);
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center p-3 bg-white border-b shadow-sm">
        <button onClick={onBack} className="text-neutral-700 mr-3">
          ← Back
        </button>
        <div className="font-medium text-sm">
          {selected ? selected.title : "No note selected"}
        </div>
      </div>
      {selected ? (
        <textarea
          ref={editorRef}
          className="flex-1 p-4 outline-none resize-none bg-neutral-50 text-base"
          placeholder={"Write your note here...\n\nFirst line will be the title."}
          value={selected.content}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="flex-1 grid place-items-center text-neutral-400">
          Select a note from List.
        </div>
      )}
    </div>
  );
}
