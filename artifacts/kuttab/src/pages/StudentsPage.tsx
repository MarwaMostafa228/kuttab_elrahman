import React, { useState } from "react";
import { useListStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, useListCircles, getListStudentsQueryKey } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Edit, Trash2, Copy, Users } from "lucide-react";

const studentSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  enrollmentDate: z.string().optional(),
  circleId: z.coerce.number().optional().nullable(),
  notes: z.string().optional(),
});

export default function StudentsPage() {
  const { data: students, isLoading } = useListStudents();
  const { data: circles } = useListCircles();
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: { name: "", phone: "", dateOfBirth: "", enrollmentDate: new Date().toISOString().split('T')[0], notes: "" },
  });

  const onSubmit = (values: z.infer<typeof studentSchema>) => {
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
          setEditingStudent(null);
          toast({ title: "تم التحديث", description: "تم تحديث بيانات الطالب بنجاح" });
        }
      });
    } else {
      createMutation.mutate({ data: values as any }, {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
          setIsAddOpen(false);
          form.reset();
          toast({ title: "تمت الإضافة", description: `تمت إضافة الطالب بنجاح. كود الطالب: ${data.studentCode}` });
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الطالب؟")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
          toast({ title: "تم الحذف", description: "تم حذف الطالب بنجاح" });
        }
      });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "تم النسخ", description: "تم نسخ كود الطالب" });
  };

  const openEdit = (student: any) => {
    setEditingStudent(student);
    form.reset({
      name: student.name,
      phone: student.phone || "",
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : "",
      enrollmentDate: student.enrollmentDate ? student.enrollmentDate.split('T')[0] : "",
      circleId: student.circleId,
      notes: student.notes || "",
    });
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">الطلاب</h1>
          <p className="text-muted-foreground">إدارة بيانات طلاب الحلقات</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) form.reset(); }}>
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
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>حفظ</Button>
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
                <TableHead className="text-center w-24">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && students?.map(student => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm bg-muted px-2 py-1 rounded" dir="ltr">{student.studentCode}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => copyCode(student.studentCode)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{student.circleName || "—"}</TableCell>
                  <TableCell dir="ltr" className="text-right">{student.phone || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Dialog open={editingStudent?.id === student.id} onOpenChange={(open) => { if(!open) setEditingStudent(null); }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(student)} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md" dir="rtl">
                          <DialogHeader><DialogTitle>تعديل بيانات الطالب</DialogTitle></DialogHeader>
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
                                      <FormControl><SelectTrigger><SelectValue placeholder="اختر الحلقة" /></SelectTrigger></FormControl>
                                      <SelectContent>
                                        <SelectItem value="none">بدون حلقة</SelectItem>
                                        {circles?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                              </div>
                              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>تحديث</Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id)} className="h-8 w-8 text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {students?.length === 0 && (
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
