import { useState } from "react";
import { Link } from "react-router-dom";
import {
  usePublicComments,
  usePostPublicComment,
} from "@/hooks/usePublicComments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink,
  MessageSquare,
  Bug,
  ChevronDown,
  ChevronUp,
  Send,
  FileText,
  ArrowLeft,
} from "lucide-react";

const PROJECTS = [
  {
    slug: "telcom-customer-churn",
    title: "Telcom Customer Churn Prediction & Insights Platform",
    description:
      "A full-stack machine learning solution designed to help businesses identify and retain at-risk customers using baseline ML models and an interactive dashboard.",
    tech: ["React", "Python", "Docker"],
    link: null,
    charter: "https://res.cloudinary.com/dpvavfbuu/image/upload/v1779018526/Telecom_Customer_Churn_Prediction_Insights_Project_Charter_urdhqk.pdf",
  },
  {
    slug: "smart-resume-matching",
    title: "Smart Resume–Job Matching Model",
    description:
      'A secure, centralized platform that automates resume parsing and evaluation, providing "Match Scores" and skill-gap suggestions for PCIC members.',
    tech: ["React", "Node.js", "Docker"],
    link: "https://smart-resume-job-matching-system.vercel.app",
    charter: "https://res.cloudinary.com/dpvavfbuu/image/upload/v1779018526/Smart_Resume_-_Job_Matching_Project_Charter_i17uiu.pdf",
  },
  {
    slug: "internship-readiness",
    title: "Internship Readiness Assessment & Recommendation Platform",
    description:
      "A data-driven platform evaluating student preparedness via NLP skill extraction and ML classifiers, providing personalized recommendations via a dashboard.",
    tech: ["Python", "React", "Node.js"],
    link: "https://internship-readiness-platform.vercel.app/",
    charter: "https://res.cloudinary.com/dpvavfbuu/image/upload/v1779018526/Internship_Readiness_Assessment_Recommendation_System_-_Project_Charter_arlgnf.pdf",
  },
  {
    slug: "group-assignment-coordination",
    title: "Group Assignment Coordination Site",
    description:
      "A web application that automates fair student group allocations using randomization logic and role-based access to improve academic accountability.",
    tech: ["React", "Node.js", "MySQL"],
    link: "https://gacs-theta.vercel.app",
    charter: "https://res.cloudinary.com/dpvavfbuu/image/upload/v1779018526/Group_Assignment_Coordination_System_-_Project_Charter_enkkfy.pdf",
  },
  {
    slug: "campus-event-rsvp",
    title: "Campus Event & RSVP Tracker",
    description:
      "A centralized platform for managing event lifecycles, RSVP limits, and attendance validation via QR codes to replace manual spreadsheet tracking.",
    tech: ["React", "Node.js", "MySQL"],
    link: "https://campus-event-rsvp-tracker.vercel.app",
    charter: "https://res.cloudinary.com/dpvavfbuu/image/upload/v1779018528/Campus_event_RSVP_Project_Charter_jwv0ps.pdf",
  },
  {
    slug: "pcic-lms",
    title: "PCIC LMS",
    description:
      "A lightweight management system for monitoring student progress with centralized dashboards, automated tracking, and exportable analytics.",
    tech: ["React", "PHP", "MySQL"],
    link: "http://vpms-hawassaa.infinityfreeapp.com/",
    charter: "https://res.cloudinary.com/dpvavfbuu/image/upload/v1779018986/LMS_Project_Charter_wju1hc.pdf",
  },
  {
    slug: "fault-reporting",
    title: "Fault Reporting Mobile Platform",
    description:
      "A decentralized maintenance solution for the IoT campus allowing users to report infrastructure faults with GPS location and photo evidence.",
    tech: ["Flutter", "Google Maps API", "Supabase"],
    link: null,
    charter: "https://res.cloudinary.com/dpvavfbuu/image/upload/v1779018526/Fault_Reporting_System_-_Project_Charter_veioyq.pdf",
  },
  {
    slug: "pcic-management-system",
    title: "PCIC Management System",
    description:
      "An internal platform automating workflows for membership, leadership decision logging, and academic quality metrics with role-based security.",
    tech: ["React", "Node.js", "MongoDB"],
    link: "https://pcic.tech",
    charter: "https://res.cloudinary.com/dpvavfbuu/image/upload/v1779019335/PCIC_Internal_Managment_Tool_Charter_bhxzby.pdf",
  },
];

const TECH_COLORS = {
  React: "bg-sky-500/15 text-sky-700 border-sky-500/25",
  "Node.js": "bg-emerald-500/15 text-emerald-700 border-emerald-500/25",
  Python: "bg-amber-500/15 text-amber-700 border-amber-500/25",
  Docker: "bg-blue-500/15 text-blue-700 border-blue-500/25",
  MySQL: "bg-orange-500/15 text-orange-700 border-orange-500/25",
  MongoDB: "bg-green-500/15 text-green-700 border-green-500/25",
  PHP: "bg-indigo-500/15 text-indigo-700 border-indigo-500/25",
  Flutter: "bg-cyan-500/15 text-cyan-700 border-cyan-500/25",
  "Google Maps API": "bg-red-500/15 text-red-700 border-red-500/25",
  Supabase: "bg-teal-500/15 text-teal-700 border-teal-500/25",
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function CommentSection({ slug }) {
  const { data: comments = [], isLoading } = usePublicComments(slug);
  const postMutation = usePostPublicComment();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("comment");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;
    postMutation.mutate(
      { projectSlug: slug, authorName: name.trim(), body: body.trim(), type },
      {
        onSuccess: () => {
          setBody("");
          setType("comment");
        },
      }
    );
  };

  return (
    <div className="mt-4">
      <button
        id={`toggle-comments-${slug}`}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments & Bug Reports
          {comments.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
              {comments.length}
            </Badge>
          )}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-4 rounded-lg border bg-muted/30 p-4">
          {/* Comment form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor={`name-${slug}`} className="text-xs">
                  Your Name
                </Label>
                <Input
                  id={`name-${slug}`}
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`type-${slug}`} className="text-xs">
                  Type
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    id={`type-comment-${slug}`}
                    variant={type === "comment" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => setType("comment")}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    Comment
                  </Button>
                  <Button
                    type="button"
                    id={`type-bug-${slug}`}
                    variant={type === "bug" ? "destructive" : "outline"}
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => setType("bug")}
                  >
                    <Bug className="h-3.5 w-3.5 shrink-0" />
                    Bug Report
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`body-${slug}`} className="text-xs">
                {type === "bug" ? "Describe the bug" : "Your comment"}
              </Label>
              <Textarea
                id={`body-${slug}`}
                placeholder={
                  type === "bug"
                    ? "Describe the issue, steps to reproduce, and expected behavior..."
                    : "Share your thoughts..."
                }
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={1000}
                rows={3}
                className="text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {body.length}/1000
              </p>
              <Button
                type="submit"
                size="sm"
                id={`submit-comment-${slug}`}
                disabled={
                  !name.trim() || !body.trim() || postMutation.isPending
                }
                className="gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                {postMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
            {postMutation.isError && (
              <p className="text-xs text-destructive">
                {postMutation.error?.message || "Failed to post"}
              </p>
            )}
          </form>

          <Separator />

          {/* Comment list */}
          {isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Loading comments...
            </p>
          ) : comments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No comments yet — be the first!
            </p>
          ) : (
            <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {comments.map((c) => (
                <div
                  key={c._id}
                  className="rounded-md border bg-background p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {c.authorName}
                      </span>
                      {c.type === "bug" && (
                        <Badge
                          variant="destructive"
                          className="h-5 px-1.5 text-[10px]"
                        >
                          <Bug className="mr-0.5 h-3 w-3" />
                          Bug
                        </Badge>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(c.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }) {
  return (
    <Card className="flex flex-col transition-shadow duration-200 hover:shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg leading-tight">{project.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <CardDescription className="mb-4 flex-1 text-sm leading-relaxed">
          {project.description}
        </CardDescription>

        {/* Tech stack badges */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {project.tech.map((t) => (
            <span
              key={t}
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                TECH_COLORS[t] || "bg-secondary text-secondary-foreground"
              }`}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="mb-2 flex flex-col gap-2">
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              id={`visit-${project.slug}`}
            >
              <Button variant="outline" size="sm" className="w-full gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                Visit Project
              </Button>
            </a>
          )}
          {project.charter && (
            <a
              href={project.charter}
              target="_blank"
              rel="noopener noreferrer"
              id={`charter-${project.slug}`}
            >
              <Button variant="outline" size="sm" className="w-full gap-2">
                <FileText className="h-3.5 w-3.5" />
                View Charter
              </Button>
            </a>
          )}
        </div>

        {/* Comments */}
        <CommentSection slug={project.slug} />
      </CardContent>
    </Card>
  );
}

export default function PeakProjects() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <header className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-primary/10 to-accent">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iLjAyIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtNGgydjRoNHYyaC00djRoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/"
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to PCIC</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-md">
              PCIC
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Peak Projects
                </span>
              </h1>
              <p className="mt-1 text-muted-foreground sm:text-lg">
                Community-built projects by the Peak Craft Informatics Community
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground/80">
            Explore the portfolio of projects created by 30+ students across
            Information Systems, Computer Science, and Information Technology at
            Hawassa University. Leave feedback or report bugs on any project.
          </p>
        </div>
      </header>

      {/* Project grid */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()}{" "}
            <a
              href="https://pcic.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground transition-colors hover:text-primary"
            >
              pcic.tech
            </a>{" "}
            — Peak Craft Informatics Community, Hawassa University
          </p>
        </div>
      </footer>
    </div>
  );
}
