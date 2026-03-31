"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: "#fa4779" }}>FourSquare</h1>
          <p className="text-sm text-slate-500">Plan together, move together.</p>
        </div>

        {mode === "signin" ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="name-example@gmail.com" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="password" />
            </div>
            <Link href="/dashboard">
              <Button className="w-full">Sign In</Button>
            </Link>
            <div className="text-center text-xs text-slate-500">Or continue with Google</div>
            <Button variant="outline" className="w-full">
              Continue with Google
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select defaultValue="member">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full">Create Account</Button>
          </div>
        )}

        <button
          onClick={() => setMode((current) => (current === "signin" ? "signup" : "signin"))}
          className="w-full text-sm text-primary"
        >
          {mode === "signin" ? "Need an account? Sign Up" : "Already have an account? Sign In"}
        </button>
      </div>
    </div>
  );
}
