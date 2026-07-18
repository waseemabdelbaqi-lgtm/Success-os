import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <section className="phase11-auth mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      {children}
    </section>
  );
}
