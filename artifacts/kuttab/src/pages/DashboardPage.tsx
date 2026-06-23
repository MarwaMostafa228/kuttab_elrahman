import React from "react";
import { useGetAnalyticsOverview } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Circle, BookOpen, CheckSquare, Wallet, Receipt, Award } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function DashboardPage() {
  const { data, isLoading } = useGetAnalyticsOverview();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Spinner className="w-8 h-8 text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    { title: "إجمالي الطلاب", value: data?.totalStudents || 0, icon: Users, color: "text-blue-600" },
    { title: "الحلقات النشطة", value: data?.totalCircles || 0, icon: Circle, color: "text-secondary" },
    { title: "معدل الحضور", value: `${Math.round(data?.attendanceRate || 0)}%`, icon: CheckSquare, color: "text-green-600" },
    { title: "أيام التسميع", value: data?.totalMemorizationDays || 0, icon: BookOpen, color: "text-purple-600" },
    { title: "تحصيلات الشهر", value: data?.totalPaymentsThisMonth || 0, icon: Wallet, color: "text-emerald-600" },
    { title: "مصروفات الشهر", value: data?.totalExpensesThisMonth || 0, icon: Receipt, color: "text-red-600" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-primary mb-2">لوحة التحكم</h1>
        <p className="text-muted-foreground">نظرة عامة على أداء دار تحفيظ القرآن الكريم</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="border-border/50 shadow-sm hover-elevate transition-all">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-xl">
              <Award className="w-5 h-5 text-secondary" />
              أبرز الطلاب المتميزين
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.topStudents && data.topStudents.length > 0 ? (
              <div className="space-y-4">
                {data.topStudents.map((student, i) => (
                  <div key={student.studentId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {i + 1}
                      </div>
                      <span className="font-bold">{student.name}</span>
                    </div>
                    <span className="text-sm bg-secondary/20 text-secondary-foreground px-2 py-1 rounded-md font-medium">
                      {student.memorizationDays} يوم تسميع
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">لا يوجد بيانات كافية بعد</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-xl">
              <BookOpen className="w-5 h-5 text-primary" />
              أحدث النشاطات
            </CardTitle>
          </CardHeader>
          <CardContent>
             {data?.recentActivity && data.recentActivity.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {data.recentActivity.map((activity, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-muted shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      {activity.type === 'memorization' && <BookOpen className="w-4 h-4 text-primary" />}
                      {activity.type === 'attendance' && <CheckSquare className="w-4 h-4 text-secondary" />}
                      {activity.type === 'student' && <Users className="w-4 h-4 text-blue-500" />}
                      {activity.type === 'payment' && <Wallet className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg bg-card border shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-foreground">{activity.description}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(activity.date).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">لا توجد نشاطات مسجلة مؤخراً</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
