import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useGetStudentAnalytics, useListMemorization, useListAttendance, useListCircles } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckSquare, Calendar, Video, Wallet } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function StudentPortalPage() {
  const { studentId } = useAuth();
  
  const { data: analytics, isLoading: analyticsLoading } = useGetStudentAnalytics(studentId as number, { query: { enabled: !!studentId } });
  const { data: memorization, isLoading: memoLoading } = useListMemorization({ studentId: studentId as number }, { query: { enabled: !!studentId } });
  const { data: attendance, isLoading: attLoading } = useListAttendance({ studentId: studentId as number }, { query: { enabled: !!studentId } });
  const { data: circles } = useListCircles();

  if (analyticsLoading || memoLoading || attLoading) {
    return <StudentLayout><div className="flex justify-center py-20"><Spinner size="lg" className="text-primary" /></div></StudentLayout>;
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "ممتاز": return "bg-green-100 text-green-800 border-green-200";
      case "جيد جداً": return "bg-teal-100 text-teal-800 border-teal-200";
      case "جيد": return "bg-blue-100 text-blue-800 border-blue-200";
      case "مقبول": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ضعيف": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "حاضر": return "bg-green-100 text-green-800";
      case "غائب": return "bg-red-100 text-red-800";
      case "متأخر": return "bg-yellow-100 text-yellow-800";
      case "معذور": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <StudentLayout>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <BookOpen className="w-8 h-8 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">أيام التسميع</p>
            <p className="text-2xl font-bold text-primary">{analytics?.totalMemorizationDays || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/10 border-secondary/20">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <CheckSquare className="w-8 h-8 text-secondary mb-2" />
            <p className="text-sm text-muted-foreground">معدل الحضور</p>
            <p className="text-2xl font-bold text-secondary">{Math.round(analytics?.attendanceRate || 0)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Wallet className="w-8 h-8 text-emerald-600 mb-2" />
            <p className="text-sm text-muted-foreground">المدفوعات</p>
            <p className="text-2xl font-bold text-emerald-700">{analytics?.totalPayments || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Calendar className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-sm text-muted-foreground">الغياب</p>
            <p className="text-2xl font-bold text-blue-700">
              {attendance?.filter(a => a.status === 'غائب').length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-sm border-border">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              سجل التسميع
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">السورة</TableHead>
                  <TableHead className="text-center">التقييم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memorization?.slice(0, 10).map(record => (
                  <TableRow key={record.id}>
                    <TableCell className="text-sm">{new Date(record.date).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell>
                      <span className="font-bold">{record.surahName}</span>
                      <span className="text-xs text-muted-foreground block">{record.fromVerse} - {record.toVerse}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={getRatingColor(record.rating)}>{record.rating}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!memorization || memorization.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">لا يوجد سجل تسميع</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-secondary" />
              سجل الحضور
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance?.slice(0, 10).map(record => (
                  <TableRow key={record.id}>
                    <TableCell className="text-sm">{new Date(record.date).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-transparent ${getStatusColor(record.status)}`}>{record.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!attendance || attendance.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">لا يوجد سجل حضور</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
