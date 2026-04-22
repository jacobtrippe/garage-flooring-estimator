import { Suspense } from "react";
import { ProductsAdminContent } from "./products-content";

export default function ProductsAdmin() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <ProductsAdminContent />
    </Suspense>
  );
}
