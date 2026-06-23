import React, { useState } from "react";
import { useLocation } from "wouter";
import { useListStudents, useCreateStudent, useDeleteStudent, useListCircles, getListStudentsQueryKey } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Copy, Eye } from "lucide-react";

const studentSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  enrollmentDate: z.string().optional(),
  circleId: z.coerce.number().optional().nullable(),
  notes: z.string().optional(),
});

export default function StudentsPage() {
  const [, setLocation] = useLocation();
  const { data: students, isLoading } = useListStudents();
  const { data: circles } = useListCircles();
  const createMutation = useCreateStudent();
  const deleteMutation = useDeleteStudent();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: { name: "", phone: "", dateOfBirth: "", enrollmentDate: new Date().toISOString().split('T')[0], notes: "" },
  });

  const onSubmit = (values: z.infer<typeof studentSchema>) => {
    createMutation.mutate({ data: values as any }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
        setIsAddOpen(false);
        form.reset();
        toast({ title: "تمت الإضافة", description: `تمت إضافة الطالب. كود الطالب: ${data.studentCode}` });
      },
      onError: () => {
        toast({ variant: "destructive", title: "خطأ", description: "تعذّر إضافة الطالب" });
      }
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`هل أنت متأكد من حذف الطالب "${name}"؟`)) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
          toast({ title: "تم الحذف" });
        }
      });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "تم النسخ", description: "تم نسخ كود الطالب" });
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">الطلاب</h1>
          <p className="text-muted-foreground">إدارة بيانات طلاب الحلقات</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) form.reset(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="btn-add-student">
              <Plus className="w-4 h-4" /> إضافة طالب
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة طالب جديد</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>اسم الطالب</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="circleId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحلقة</FormLabel>
                      <Select onValueChange={(val) => field.onChange(val === "none" ? null : Number(val))} value={field.value?.toString() || "none"}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="اختر الحلقة" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">بدون حلقة</SelectItem>
                          {circles?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                    <FormItem><FormLabel>تاريخ الميلاد</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="enrollmentDate" render={({ field }) => (
                    <FormItem><FormLabel>تاريخ الالتحاق</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "جاري الإضافة..." : "إضافة"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">كود الطالب</TableHead>
                <TableHead className="text-right">الحلقة</TableHead>
                <TableHead className="text-right">رقم الهاتف</TableHead>
                <TableHead className="text-center w-28">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">جاري التحميل...</TableCell>
                </TableRow>
              )}
              {!isLoading && students?.map(student => (
                <TableRow
                  key={student.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setLocation(`/students/${student.id}`)}
                >
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm bg-muted px-2 py-1 rounded" dir="ltr">{student.studentCode}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => copyCode(student.studentCode)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{student.circleName || "—"}</TableCell>
                  <TableCell dir="ltr" className="text-right">{student.phone || "—"}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => setLocation(`/students/${student.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id, student.name)} className="h-8 w-8 text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && students?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا يوجد طلاب مسجلين</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
