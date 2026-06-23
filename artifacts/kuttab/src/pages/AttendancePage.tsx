import React, { useState } from "react";
import { useListAttendance, useRecordAttendance, useUpdateAttendance, useListStudents, useListCircles, getListAttendanceQueryKey } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const STATUSES = ["حاضر", "غائب", "متأخر", "معذور"];

export default function AttendancePage() {
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterCircle, setFilterCircle] = useState<string>("all");
  
  const { data: students } = useListStudents();
  const { data: circles } = useListCircles();
  const { data: attendanceRecords, isLoading } = useListAttendance({ 
    date: filterDate, 
    circleId: filterCircle !== "all" ? Number(filterCircle) : undefined 
  });
  
  const recordMutation = useRecordAttendance();
  const updateMutation = useUpdateAttendance();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleMarkStatus = (studentId: number, status: string) => {
    const existingRecord = attendanceRecords?.find(r => r.studentId === studentId);
    
    if (existingRecord) {
      updateMutation.mutate({ 
        id: existingRecord.id, 
        data: { status } 
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAttendanceQueryKey() });
        }
      });
    } else {
      recordMutation.mutate({ 
        data: { studentId, date: filterDate, status, circleId: students?.find(s => s.id === studentId)?.circleId || undefined } as any
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAttendanceQueryKey() });
        }
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "حاضر": return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200";
      case "غائب": return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200";
      case "متأخر": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200";
      case "معذور": return "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200";
      default: return "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200";
    }
  };

  const filteredStudents = students?.filter(s => {
    if (filterCircle === "all") return true;
    if (filterCircle === "none") return !s.circleId;
    return s.circleId === Number(filterCircle);
  }) || [];

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">الحضور والغياب</h1>
          <p className="text-muted-foreground">تسجيل ومتابعة حضور الطلاب</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input 
            type="date" 
            value={filterDate} 
            onChange={(e) => setFilterDate(e.target.value)} 
            className="w-full md:w-40"
          />
          <Select value={filterCircle} onValueChange={setFilterCircle}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="اختر الحلقة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحلقات</SelectItem>
              <SelectItem value="none">بدون حلقة</SelectItem>
              {circles?.map(c => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-right">الطالب</TableHead>
                <TableHead className="text-right">الحلقة</TableHead>
                <TableHead className="text-center">الحالة الحالية</TableHead>
                <TableHead className="text-center">تسجيل الحضور</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map(student => {
                const record = attendanceRecords?.find(r => r.studentId === student.id);
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-bold">{student.name}</TableCell>
                    <TableCell>{student.circleName || "—"}</TableCell>
                    <TableCell className="text-center">
                      {record ? (
                        <Badge variant="outline" className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">لم يسجل</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        {STATUSES.map(status => (
                          <Button
                            key={status}
                            variant={record?.status === status ? "default" : "outline"}
                            size="sm"
                            className={`h-8 ${record?.status === status ? getStatusColor(status).replace('hover:', '') : ''}`}
                            onClick={() => handleMarkStatus(student.id, status)}
                            disabled={recordMutation.isPending || updateMutation.isPending}
                          >
                            {status}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">لا يوجد طلاب مطابقين للبحث</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
