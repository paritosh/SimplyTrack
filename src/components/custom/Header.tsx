
"use client";

import Link from "next/link";
import { BarChart3, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">SimplyTrack</span>
        </Link>
        <Button variant="outline" size="sm" asChild>
          <a href="mailto:sumrao.paritosh@gmail.com">
            <Mail className="mr-2 h-4 w-4" />
            Give Feedback
          </a>
        </Button>
      </div>
    </header>
  );
}
