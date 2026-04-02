"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function InviteModal() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/login`
      : "https://foursquare.app/login";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white">
        Invite Member
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite link</DialogTitle>
        </DialogHeader>
        <p className="break-all rounded-md bg-slate-100 p-3 text-sm text-slate-800">{link}</p>
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
          onClick={copyLink}
        >
          <Copy size={16} />
          {copied ? "Copied!" : "Copy link"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
