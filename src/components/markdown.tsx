import React from "react";

/**
 * Minimal, dependency-free Markdown renderer for academy lesson bodies.
 * Handles the subset present in the GS 1207 corpus slices: ATX headings,
 * unordered/ordered lists, blockquotes, and inline bold/italic/code. Input is
 * escaped first, so this never injects raw HTML.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Split on **bold**, *italic*, `code`
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(re);
  parts.forEach((part, i) => {
    if (!part) return;
    if (part.startsWith("**") && part.endsWith("**")) {
      nodes.push(<strong key={i}>{part.slice(2, -2)}</strong>);
    } else if (part.startsWith("*") && part.endsWith("*")) {
      nodes.push(<em key={i}>{part.slice(1, -1)}</em>);
    } else if (part.startsWith("`") && part.endsWith("`")) {
      nodes.push(
        <code key={i} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    } else {
      nodes.push(<React.Fragment key={i}>{part}</React.Fragment>);
    }
  });
  return nodes;
}

export function Markdown({ source }: { source: string }) {
  const lines = escapeHtml(source).split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let listOrdered = false;
  let key = 0;

  const flushList = () => {
    if (!list.length) return;
    const items = list.map((it, i) => <li key={i}>{inline(it)}</li>);
    blocks.push(
      listOrdered ? (
        <ol key={key++} className="ml-5 list-decimal space-y-1.5 text-sm leading-relaxed">
          {items}
        </ol>
      ) : (
        <ul key={key++} className="ml-5 list-disc space-y-1.5 text-sm leading-relaxed">
          {items}
        </ul>
      )
    );
    list = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);

    if (heading) {
      flushList();
      const level = heading[1].length;
      const text = inline(heading[2]);
      if (level <= 2) blocks.push(<h3 key={key++} className="mt-6 text-lg font-bold">{text}</h3>);
      else if (level === 3) blocks.push(<h4 key={key++} className="mt-5 text-base font-semibold">{text}</h4>);
      else blocks.push(<h5 key={key++} className="mt-4 text-sm font-semibold">{text}</h5>);
      continue;
    }
    if (line.startsWith(">")) {
      flushList();
      blocks.push(
        <blockquote key={key++} className="border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
          {inline(line.replace(/^>\s?/, ""))}
        </blockquote>
      );
      continue;
    }
    if (ul) {
      if (listOrdered) flushList();
      listOrdered = false;
      list.push(ul[1]);
      continue;
    }
    if (ol) {
      if (!listOrdered) flushList();
      listOrdered = true;
      list.push(ol[1]);
      continue;
    }
    if (line.trim() === "") {
      flushList();
      continue;
    }
    flushList();
    blocks.push(
      <p key={key++} className="text-sm leading-relaxed text-muted-foreground">
        {inline(line)}
      </p>
    );
  }
  flushList();

  return <div className="space-y-3">{blocks}</div>;
}
