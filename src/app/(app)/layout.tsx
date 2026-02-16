import { AppShell } from "@/components/app-shell";
import { TimerProvider } from "@/components/timer/timer-provider";
import { FloatingTimer } from "@/components/timer/floating-timer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TimerProvider>
      <AppShell>{children}</AppShell>
      <FloatingTimer />
    </TimerProvider>
  );
}
