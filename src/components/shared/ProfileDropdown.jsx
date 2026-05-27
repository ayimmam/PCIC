import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMyProfile, useMyStrikes, useMyAttendance, useUpdateMyName, useChangePassword } from "@/hooks/useMyProfile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, LogOut, Pencil, Lock, AlertTriangle, CalendarCheck } from "lucide-react";
import { toast } from "sonner";

const statusVariant = { active: "success", warning: "warning", inactive: "danger", suspended: "destructive" };
const batchLabels = { batch_1: "Batch 1", batch_2: "Batch 2", batch_3: "Batch 3" };

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const { data: profile } = useMyProfile();
  const { data: strikes } = useMyStrikes();
  const { data: attendance } = useMyAttendance();
  const updateName = useUpdateMyName();
  const changePassword = useChangePassword();

  const [editNameOpen, setEditNameOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const displayUser = profile || user;
  if (!displayUser) return null;

  const initials = displayUser.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const handleNameSave = async () => {
    if (!newName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    try {
      await updateName.mutateAsync(newName.trim());
      toast.success("Name updated successfully");
      setEditNameOpen(false);
      setNewName("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update name");
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("All fields are required");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      toast.success("Password changed successfully");
      setPasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    }
  };

  const checkedInCount = attendance?.filter((e) => e.checkedIn).length || 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            id="profile-dropdown-trigger"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-2 ring-primary/20 transition-all hover:ring-4 hover:ring-primary/30 focus:outline-none"
          >
            {initials}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72 p-0">
          {/* Profile info header */}
          <div className="bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{displayUser.name}</p>
                <p className="truncate text-xs text-muted-foreground">{displayUser.email}</p>
              </div>
            </div>
          </div>

          {/* Profile details */}
          <div className="space-y-2 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Domain</span>
              <Badge variant="outline">{displayUser.domain}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Batch</span>
              <Badge variant="secondary">{batchLabels[displayUser.batch] || displayUser.batch}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={statusVariant[displayUser.status] || "secondary"}>
                {displayUser.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Strikes</span>
              <span className="flex items-center gap-1 text-sm font-medium">
                {strikes?.length > 0 && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                {strikes?.length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Events attended</span>
              <span className="flex items-center gap-1 text-sm font-medium">
                <CalendarCheck className="h-3.5 w-3.5 text-green-600" />
                {checkedInCount}
              </span>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Actions */}
          <div className="p-2 space-y-1">
            <button
              id="edit-name-button"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                setNewName(displayUser.name || "");
                setEditNameOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit Name
            </button>
            <button
              id="change-password-button"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => setPasswordOpen(true)}
            >
              <Lock className="h-4 w-4" />
              Change Password
            </button>
            <Separator />
            <button
              id="sign-out-button"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Name Dialog */}
      <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Name</DialogTitle>
            <DialogDescription>Update your display name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="edit-name-input">Name</Label>
              <Input
                id="edit-name-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter your name"
                onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleNameSave} disabled={updateName.isPending}>
              {updateName.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password and a new password (min 6 characters).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordChange()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange} disabled={changePassword.isPending}>
              {changePassword.isPending ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
