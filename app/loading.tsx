export default function LoadingPage(): React.ReactNode {
  return (
    <section className="brand-surface flex min-h-[60vh] items-center justify-center px-6 py-20">
      <div className="text-center">
        <div className="relative mx-auto h-20 w-24">
          <span className="book-3d absolute bottom-0 left-1 h-16 w-10 -rotate-12 animate-pulse rounded-l bg-[#8b1e1e]" />
          <span className="book-3d absolute bottom-0 left-8 h-20 w-12 rotate-3 animate-pulse rounded-l bg-[#d4af37] [animation-delay:160ms]" />
          <span className="book-3d absolute bottom-0 right-1 h-14 w-9 rotate-12 animate-pulse rounded-l bg-[#6b1016] [animation-delay:320ms]" />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-[#8b1e1e]">
          Opening your library
        </p>
      </div>
    </section>
  );
}
