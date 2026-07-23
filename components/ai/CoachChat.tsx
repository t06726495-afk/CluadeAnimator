"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { askCoach } from "@/lib/actions/ai";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";

type Message = { role: "user" | "assistant"; content: string };

export function CoachChat({ teamId, teamName }: { teamId: string; teamName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  function send() {
    const text = input.trim();
    if (!text || pending) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setError(null);
    startTransition(async () => {
      const result = await askCoach({ teamId, messages: next });
      if (result.reply) {
        setMessages((m) => [...m, { role: "assistant", content: result.reply! }]);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-260px)] min-h-[320px]">
      <div className="flex-1 overflow-y-auto space-y-3 pb-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted">
            Ask anything about coaching {teamName}: drill ideas, warm-up
            routines, pitch counts, how to structure a practice, or how to
            handle a specific skill level. Answers are grounded in
            DiamondPlan&rsquo;s drill library for this team&rsquo;s age tier.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-black/5 dark:bg-white/10"
            }`}
          >
            {m.content}
          </div>
        ))}
        {pending && <p className="text-sm text-muted">Thinking...</p>}
        {error && <p className="text-sm font-medium text-danger">{error}</p>}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 border-t-2 border-border pt-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask a coaching question..."
          className="min-h-11 flex-1"
        />
        <Button type="button" onClick={send} disabled={pending}>
          Send
        </Button>
      </div>
    </div>
  );
}
