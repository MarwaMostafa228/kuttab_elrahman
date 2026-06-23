import React, { useState } from "react";
import { useGetAnalyticsOverview, useGetStudentAnalytics, useListStudents } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Spinner } from "@/components/ui/spinner";
import { TrendingUp, BookOpen, CheckSquare } from "lucide-react";

export default function AnalyticsPage() {
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  
  const { data: overview, isLoading: overviewLoading } = useGetAnalyticsOverview();
  const { data: students } = useListStudents();
  const { data: studentAnalytics, isLoading: studentLoading } = useGetStudentAnalytics(
    selectedStudentId as number, 
    { query: { enabled: !!selectedStudentId } }
  );

  // Mock data for charts if none exists (just for visual since API doesn't return full time series)
  const monthlyData = [
    { name: 'يناير', value: 400 },
    { name: 'فبراير', value: 300 },
    { name: 'مارس', value: 550 },
    { name: 'أبريل', value: 450 },
    { name: 'مايو', value: 600 },
    { name: 'يونيو', value: 700 },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-serif font-bold text-primary">المحلل الذكي</h1>
        <p className="text-muted-foreground">تحليلات وإحصاءات دقيقة لأداء الدار والطلاب</p>
      </div>

      <div className="w-full max-w-sm mb-8">
        <Select 
          value={selectedStudentId ? selectedStudentId.toString() : "overview"} 
          onValueChange={(v) => setSelectedStudentId(v === "overview" ? null : Number(v))}
        >
          <SelectTrigger className="bg-card">
            <SelectValue placeholder="اختر العرض" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">نظرة عامة على الدار</SelectItem>
            {students?.map(s => <SelectItem key={s.id} value={s.id.toString()}>تحليل الطالب: {s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {overviewLoading ? (
        <div className="flex h-64 items-center justify-center"><Spinner size="lg" className="text-primary" /></div>
      ) : selectedStudentId && studentAnalytics ? (
        // Student Specific Analytics
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full text-primary">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">أيام التسميع</p>
                    <h3 className="text-2xl font-bold text-primary">{studentAnalytics.totalMemorizationDays}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-secondary/10 border-secondary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-secondary/20 rounded-full text-secondary-foreground">
                    <CheckSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">معدل الحضور</p>
                    <h3 className="text-2xl font-bold text-secondary-foreground">{Math.round(studentAnalytics.attendanceRate)}%</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif">سجل التسميع الأخير</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={studentAnalytics.memorizationHistory?.map(m => ({
                      date: new Date(m.date).toLocaleDateString('ar-EG', {month: 'short', day: 'numeric'}),
                      rating: m.rating === 'ممتاز' ? 5 : m.rating === 'جيد جداً' ? 4 : m.rating === 'جيد' ? 3 : m.rating === 'مقبول' ? 2 : 1
                    })).reverse() || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 5]} ticks={[1,2,3,4,5]} tickFormatter={(v) => v===5?'ممتاز':v===4?'جيد جداً':v===3?'جيد':v===2?'مقبول':'ضعيف'} width={70} />
                    <Tooltip />
                    <Area type="monotone" dataKey="rating" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Overview Analytics
        <div className="space-y-6 animate-in fade-in">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                النمو والتطور
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif text-lg">أداء الحلقات (نموذج)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      {name: 'السبت', a: 80, b: 90},
                      {name: 'الأحد', a: 85, b: 85},
                      {name: 'الإثنين', a: 95, b: 80},
                      {name: 'الثلاثاء', a: 90, b: 95},
                      {name: 'الأربعاء', a: 85, b: 90},
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} domain={[50, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="a" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r:4}} />
                      <Line type="monotone" dataKey="b" stroke="hsl(var(--secondary))" strokeWidth={3} dot={{r:4}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-primary text-primary-foreground shadow-sm">
              <CardContent className="p-8 flex flex-col justify-center h-full text-center">
                <h3 className="text-xl font-serif mb-4">خلاصة النظام</h3>
                <p className="opacity-90 leading-relaxed text-lg mb-6">
                  معدل الحضور العام استقر عند <span className="font-bold text-secondary">{Math.round(overview?.attendanceRate || 0)}%</span>، 
                  وقد أتم الطلاب <span className="font-bold text-secondary">{overview?.totalMemorizationDays || 0}</span> يوماً من التسميع والحفظ هذا الشهر.
                </p>
                <div className="text-right p-4 bg-black/10 rounded-lg">
                  <p className="font-bold mb-1">أفضل طالب أداءً:</p>
                  <p className="text-secondary text-xl">
                    {overview?.topStudents?.[0]?.name || "لا يوجد بيانات"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
