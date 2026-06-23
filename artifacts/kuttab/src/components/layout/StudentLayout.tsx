import React, { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LogOut, Book } from "lucide-react";

export function StudentLayout({ children }: { children: ReactNode }) {
  const { name, studentCode, logout: clearAuth } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => clearAuth(),
      onError: () => clearAuth(),
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans" dir="rtl">
      <header className="bg-primary text-primary-foreground p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Book className="w-8 h-8 text-secondary" />
            <div>
              <h1 className="text-xl font-serif font-bold text-secondary">كُتَّاب الرحمن</h1>
              <p className="text-xs opacity-80">بوابة الطالب</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-left">
              <p className="font-bold">{name}</p>
              <p className="text-xs opacity-80" dir="ltr">{studentCode}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-destructive" data-testid="button-student-logout">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
