import { cn } from "@/lib/utils";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <main className={cn("mx-auto flex w-full max-w-5xl flex-1 flex-col p-6 sm:p-10", className)}>
      {children}
    </main>
  );
}
