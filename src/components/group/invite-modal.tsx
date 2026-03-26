"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function InviteModal() {
  const link = "https://foursquare.app/invite/boston-crew";

  return (
    <Dialog>
      <DialogTrigger className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white">
        Invite Member
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Link</DialogTitle>
        </DialogHeader>
        <p className="rounded-md bg-slate-100 p-3 text-sm">{link}</p>
      </DialogContent>
    </Dialog>
  );
}
