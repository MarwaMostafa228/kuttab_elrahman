import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLogout } from "@workspace/api-client-react";
import {
  LayoutDashboard,
  Users,
  Circle,
  BookOpen,
  CheckSquare,
  Palmtree,
  UsersRound,
  Wallet,
  Receipt,
  Award,
  FileText,
  BarChart,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/students", label: "الطلاب", icon: Users },
  { href: "/circles", label: "الحلقات", icon: Circle },
  { href: "/memorization", label: "متابعة الحفظ", icon: BookOpen },
  { href: "/attendance", label: "الحضور والغياب", icon: CheckSquare },
  { href: "/vacations", label: "الإجازات", icon: Palmtree },
  { href: "/guardians", label: "أولياء الأمور", icon: UsersRound },
  { href: "/payments", label: "الدفعات", icon: Wallet },
  { href: "/expenses", label: "المصروفات", icon: Receipt },
  { href: "/certificates", label: "الشهادات", icon: Award },
  { href: "/exams", label: "الاختبارات", icon: FileText },
  { href: "/analytics", label: "المحلل الذكي", icon: BarChart },
];

function SidebarContent() {
  const [location] = useLocation();
  const { name, logout: clearAuth } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => clearAuth(),
      onError: () => clearAuth(),
    });
  };

  return (
    <div className="flex flex-col h-full bg-sidebar border-l border-sidebar-border text-sidebar-foreground">
      <div className="p-6">
        <h1 className="text-2xl font-serif font-bold text-sidebar-primary tracking-tight">كُتَّاب الرحمن</h1>
        <p className="text-sm text-sidebar-foreground/70 mt-1">نظام الإدارة</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50'}`} data-testid={`nav-${item.href.replace('/', '')}`}>
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-bold">
              {name ? name.charAt(0) : "ش"}
            </div>
            <div className="truncate">
              <p className="text-sm font-bold truncate">{name || "الشيخ"}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive" data-testid="button-logout">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <>
      <aside className="hidden md:block w-64 h-screen sticky top-0">
        <SidebarContent />
      </aside>
      <div className="md:hidden flex items-center p-4 bg-sidebar text-sidebar-foreground sticky top-0 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-64 border-none">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <h1 className="text-xl font-serif font-bold text-sidebar-primary ml-auto mr-4 tracking-tight">كُتَّاب الرحمن</h1>
      </div>
    </>
  );
}
