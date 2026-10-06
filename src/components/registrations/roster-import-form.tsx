"use client";

/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import { useState } from "react";

/*
|--------------------------------------------------
| custom imports
|--------------------------------------------------
*/
import { importRegistrationRosterAction } from "@/lib/registrations/actions";

/*
|----------------------------------------------------------------------------------------------------
| RosterImportForm
|----------------------------------------------------------------------------------------------------
| Form component managing Roster Import inputs and submissions.
*/
export function RosterImportForm() {
  /*
  |--------------------------------------------------
  | states
  |--------------------------------------------------
  */
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, setIsPending] = useState(false);

  /*
  |--------------------------------------------------
  | handlers
  |--------------------------------------------------
  */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("roster") as File | null;
    if (!file || file.size === 0) {
      setMessage({ type: "error", text: "Choose a CSV file first." });
      return;
    }
    if (file.size > 900 * 1024) {
      setMessage({ type: "error", text: "The roster CSV must be 900KB or smaller." });
      return;
    }

    setIsPending(true);
    setMessage(null);
    const result = await importRegistrationRosterAction(await file.text());
    setIsPending(false);
    if (!result.success) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    event.currentTarget.reset();
    setMessage({ type: "success", text: `Roster saved: ${result.imported} new and ${result.updated} updated registration${result.imported + result.updated === 1 ? "" : "s"}.` });
  }

  /*
  |--------------------------------------------------
  | return
  |--------------------------------------------------
  */
  return (
    <div className="rounded-2xl border border-[#E7E3DA] bg-white p-5 shadow-xs sm:p-6">
      <div className="rounded-xl bg-[#F7F4ED] p-4 text-xs leading-relaxed text-[#525252]">
        <p className="font-semibold text-[#171717]">Required CSV columns</p>
        <code className="mt-1.5 block rounded-lg bg-white px-3 py-2 font-mono text-[11px] text-[#171717]">email,name,role,track</code>
        <p className="mt-2">Use <strong>STUDENT</strong> or <strong>INSTRUCTOR</strong> for role. Track names must exactly match a track in the LMS. The <code>name</code> column is optional.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="roster" className="block text-xs font-semibold text-[#171717]">Participant roster CSV</label>
          <input id="roster" name="roster" type="file" accept=".csv,text/csv" required disabled={isPending} className="mt-1.5 block w-full rounded-xl border border-[#E7E3DA] bg-white px-3 py-2.5 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-[#171717] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#262626]" />
        </div>
        {message && <p role="alert" className={`rounded-xl border p-3 text-xs font-medium ${message.type === "error" ? "border-[#EA4335]/20 bg-[#EA4335]/5 text-[#EA4335]" : "border-[#34A853]/25 bg-[#34A853]/5 text-[#19733D]"}`}>{message.text}</p>}
        <button type="submit" disabled={isPending} className="h-11 rounded-xl bg-[#171717] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#262626] disabled:cursor-not-allowed disabled:opacity-50">
          {isPending ? "Importing roster..." : "Import roster"}
        </button>
      </form>
    </div>
  );
}
