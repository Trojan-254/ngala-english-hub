import { Sidebar } from "@/components/ngala/Sidebar";
import { StatsBar } from "@/components/ngala/StatsBar";
import { LevelProgress } from "@/components/ngala/LevelProgress";
import { ModuleCards } from "@/components/ngala/ModuleCards";
import { WeakAreas } from "@/components/ngala/WeakAreas";
import { RightSidebar } from "@/components/ngala/RightSidebar";
import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";

const Index = () => {
  const { user } = useAuth();
  const dashboard = useDashboard();

  const today = new Date().toLocaleDateString('en-KE', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  return (
    <>
      <header className="sr-only">
        <h1>Ngala English Hub — Student Dashboard</h1>
      </header>
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <div className="max-w-[1280px] mx-auto px-4 pt-20 pb-8 lg:px-8 lg:pt-8 flex gap-7">
            <div className="flex-1 min-w-0 space-y-6 animate-fade-in">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-sm font-semibold text-secondary uppercase tracking-wider">Welcome back</div>
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-foreground mt-1">
                    Hello, {user?.display_name ?? 'Student'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Five questions today and you keep your streak alive.
                  </p>
                </div>
                <div className="hidden sm:block text-xs text-muted-foreground">{today}</div>
              </div>

              <StatsBar />
              <LevelProgress />
              <ModuleCards dashboard={dashboard} />
              
              <WeakAreas topics={dashboard.grammarWeakTopics} loading={dashboard.loading} />
            </div>

            <RightSidebar />
          </div>
        </main>
      </div>
    </>
  );
};

export default Index;
