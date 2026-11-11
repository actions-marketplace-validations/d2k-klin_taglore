"use client";

import { WhatsNew } from "@taglore/whats-new";
import "@taglore/whats-new/styles.css";

/** Shows each major/minor announcement once. Rendered from app/layout.tsx. */
export default function AppWhatsNew() {
  return (
    <WhatsNew
      storageKey="myapp:whats-new"
      // url="https://cdn.example.com/myapp/releases/latest.json"  // when notes live on S3/CDN
      labels={{ heading: "What's new", close: "Got it" }}
    />
  );
}

/*
Headless variant with your own dialog (e.g. shadcn/ui):

import { WhatsNew } from "@taglore/whats-new";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function AppWhatsNew() {
  return (
    <WhatsNew>
      {({ notes, open, dismiss }) =>
        notes && (
          <Dialog open={open} onOpenChange={(o) => !o && dismiss()}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{notes.title}</DialogTitle>
                <DialogDescription>{notes.summary}</DialogDescription>
              </DialogHeader>
              <ul>{notes.highlights.map((h) => <li key={h.title}><b>{h.title}</b> {h.description}</li>)}</ul>
            </DialogContent>
          </Dialog>
        )
      }
    </WhatsNew>
  );
}
*/
