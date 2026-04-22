import { Suspense } from "react";
import { EstimatesNewContent } from "./estimates-new-content";

export default function EstimateBuilder() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <EstimatesNewContent />
    </Suspense>
  );
}
