import { Suspense } from 'react';
import BookPredictorPage from './predictor-client';

export default function PredictorRoutePage() {
  return (
    <Suspense fallback={<main className="os-content phase11-engine"><p>Opening predictor…</p></main>}>
      <BookPredictorPage />
    </Suspense>
  );
}
