import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { ContentPipeline } from "./pipeline";

export default function AdminContentPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Content Pipeline</h1>
        <p className="mt-1 text-muted-foreground">
          Generate, review, and publish AI-assisted blog posts. All generated content saves as drafts for your review before publishing.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>AI Content Generator</CardTitle>
          <CardDescription>
            Enter topics below. Each topic generates a full SEO-optimised blog post (1,100-1,500 words) with structured headings, FAQ section, and internal links. All posts are saved as drafts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContentPipeline />
        </CardContent>
      </Card>
    </div>
  );
}
