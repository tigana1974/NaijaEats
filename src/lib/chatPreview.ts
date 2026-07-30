/**
 * Turns a raw message body into a friendly one-line preview for chat lists.
 * Handles the internal encodings we use for non-text messages so users never
 * see strings like "[[AUDIO]]:voice-note-1782568672.webm" or
 * "[[CHAT_INVOICE:FFD11BD6FC]]" in their inbox.
 */
export function messagePreview(
  body: string | null | undefined,
  hasMedia: boolean = false,
): { icon: PreviewIcon; text: string } {
  const raw = (body ?? "").trim();

  if (!raw && hasMedia) return { icon: "image", text: "Photo" };
  if (!raw) return { icon: "text", text: "Say hello" };

  // Voice notes: "[[AUDIO]]:voice-note-…webm"
  if (/^\[\[AUDIO\]\]/i.test(raw)) return { icon: "audio", text: "Voice note" };

  // Chat invoices (paid-in-chat flow): "[[CHAT_INVOICE:CODE]]"
  if (/^\[\[CHAT_INVOICE:/i.test(raw)) return { icon: "invoice", text: "Invoice" };

  // Legacy inline invoice: "[[INVOICE:amount:note]]"
  const inv = raw.match(/^\[\[INVOICE:([^:\]]+)(?::([^\]]*))?\]\]$/i);
  if (inv) {
    const note = (inv[2] || "").trim();
    return { icon: "invoice", text: note ? `Invoice · ${note}` : "Invoice" };
  }

  // Document / file attachment ("📎 File: …" / "📎 Invoice: …")
  if (raw.startsWith("📎")) {
    const label = raw.replace(/^📎\s*/, "").split(":")[0]?.trim() || "File";
    return { icon: "file", text: label };
  }

  // Plain text — collapse whitespace and cap length so long paragraphs don't
  // blow out the row.
  const oneLine = raw.replace(/\s+/g, " ");
  return { icon: "text", text: oneLine.length > 120 ? oneLine.slice(0, 117) + "…" : oneLine };
}

export type PreviewIcon = "text" | "audio" | "image" | "file" | "invoice";
