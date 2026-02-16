import { AppShell } from "@/components/app-shell";
import { TimerProvider } from "@/components/timer/timer-provider";
import { PipTimer } from "@/components/timer/pip-timer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TimerProvider>
      <AppShell>{children}</AppShell>
      <PipTimer />
    </TimerProvider>
  );
}
