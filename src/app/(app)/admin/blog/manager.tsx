"use client";

import { useState } from "react";
import { Card, CardContent, Badge, Table, THead, TR, TH, TD, Button } from "@/components/ui";
import { PostEditor } from "./editor";
import { Plus } from "lucide-react";

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  status: string;
  author_name: string;
  published_at: string | null;
  created_at: string;
}

const CATEGORY_TONE: Record<string, "default" | "primary" | "info" | "success"> = {
  article: "default",
  update: "info",
  guide: "primary",
  "case-study": "success"
};

export function BlogManager({ posts: initial }: { posts: Post[] }) {
  const [posts, setPosts] = useState(initial);
  const [editing, setEditing] = useState<Post | null>(null);
  const [showNew, setShowNew] = useState(false);

  function refresh() {
    fetch("/api/v1/blog?status=published&status=draft&status=archived")
      .then(r => r.json())
      .then(j => {
        setPosts(j.data?.posts ?? []);
        setEditing(null);
        setShowNew(false);
      })
      .catch(() => {});
  }

  return (
    <div className="space-y-6">
      {showNew || editing ? (
        <PostEditor
          post={editing ?? undefined}
          onSaved={refresh}
          onDeleted={refresh}
        />
      ) : (
        <Button onClick={() => setShowNew(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Post
        </Button>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR><TH>Title</TH><TH>Category</TH><TH>Status</TH><TH>Published</TH><TH></TH></TR>
            </THead>
            <tbody>
              {posts.map((p) => (
                <TR key={p.id}>
                  <TD className="max-w-xs truncate text-sm font-medium">{p.title}</TD>
                  <TD><Badge tone={CATEGORY_TONE[p.category] ?? "default"}>{p.category}</Badge></TD>
                  <TD><Badge tone={p.status === "published" ? "success" : "warning"}>{p.status}</Badge></TD>
                  <TD className="text-xs text-muted-foreground">
                    {p.published_at ? new Date(String(p.published_at)).toLocaleDateString("en-GB") : "—"}
                  </TD>
                  <TD>
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(p); setShowNew(false); }}>
                      Edit
                    </Button>
                  </TD>
                </TR>
              ))}
              {posts.length === 0 && (
                <TR><TD colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No posts yet. Create your first one above.</TD></TR>
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
