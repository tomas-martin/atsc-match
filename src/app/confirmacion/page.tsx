import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ConfirmacionContent from './ConfirmacionContent';

export default function ConfirmacionPage() {
  return (
    <>
      <Header />
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-20">
              <div className="spinner spinner-large mb-4" />
              <p className="text-gray-blue">Cargando confirmación...</p>
            </div>
          }
        >
          <ConfirmacionContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
