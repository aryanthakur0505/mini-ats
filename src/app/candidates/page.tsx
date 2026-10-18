import { Suspense } from "react";
import { CandidatesView } from "./candidates-view";

export const metadata = { title: "Candidates · Mini ATS" };

export default function CandidatesPage() {
  return (
    <Suspense>
      <CandidatesView />
    </Suspense>
  );
}
