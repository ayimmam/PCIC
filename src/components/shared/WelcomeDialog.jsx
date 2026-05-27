import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle, BarChart3, Calendar, Users, Shield } from "lucide-react";

const DISMISSED_KEY = "pcic_welcome_dismissed";
const SESSION_KEY = "pcic_welcome_shown_this_session";

export default function WelcomeDialog() {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY) === "true";
    const shownThisSession = sessionStorage.getItem(SESSION_KEY) === "true";

    if (!dismissed && !shownThisSession) {
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(DISMISSED_KEY, "true");
    }
    sessionStorage.setItem(SESSION_KEY, "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg" id="welcome-dialog">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Welcome to PCIC
          </DialogTitle>
          <DialogDescription className="text-center">
            You have successfully signed in to the management platform.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted/50 border p-4 space-y-4">
          <p className="text-sm font-medium">
            This platform helps manage our members and makes your contributions visible to the community.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Events & Attendance</p>
                <p className="text-xs text-muted-foreground">
                  View upcoming events, check in, and track your attendance history.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Community Status</p>
                <p className="text-xs text-muted-foreground">
                  Monitor your batch level, domain assignment, and community standing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Decisions & Reports</p>
                <p className="text-xs text-muted-foreground">
                  Access leadership decisions, reports, and community resources.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Your Profile</p>
                <p className="text-xs text-muted-foreground">
                  Click your avatar (top-right) to view your profile, strikes, attendance, and manage your account.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="dont-show-again"
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(Boolean(checked))}
          />
          <Label htmlFor="dont-show-again" className="text-sm text-muted-foreground cursor-pointer">
            Don&apos;t show this again
          </Label>
        </div>

        <DialogFooter>
          <Button
            id="welcome-got-it"
            onClick={handleClose}
            className="w-full"
          >
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
