import React, { useState } from "react";
import { useListVacations, useCreateVacation, useDeleteVacation, useListStudents, getListVacationsQueryKey } from "@workspace/api-client-react";
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
import { Plus, Trash2, CalendarDays } from "lucide-react";

const vacationSchema = z.object({
  studentId: z.coerce.number().min(1, "اختر الطالب"),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
  reason: z.string().min(2, "السبب مطلوب"),
  notes: z.string().optional(),
});

export default function VacationsPage() {
  const { data: vacations, isLoading } = useListVacations();
  const { data: students } = useListStudents();
  
  const createMutation = useCreateVacation();
  const deleteMutation = useDeleteVacation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);

  const form = useForm<z.infer<typeof vacationSchema>>({
    resolver: zodResolver(vacationSchema),
    defaultValues: { studentId: 0, startDate: new Date().toISOString().split('T')[0], endDate: "", reason: "", notes: "" },
  });

  const onSubmit = (values: z.infer<typeof vacationSchema>) => {
    createMutation.mutate({ data: values as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVacationsQueryKey() });
        setIsAddOpen(false);
        form.reset();
        toast({ title: "تمت الإضافة", description: "تم تسجيل الإجازة بنجاح" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من إلغاء هذه الإجازة؟")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVacationsQueryKey() });
          toast({ title: "تم الحذف", description: "تم إلغاء الإجازة" });
        }
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">الإجازات والأعذار</h1>
          <p className="text-muted-foreground">إدارة إجازات الطلاب وأعذار الغياب</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) form.reset(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <Plus className="w-4 h-4" /> إجازة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>تسجيل إجازة / عذر</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="studentId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الطالب</FormLabel>
                    <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value ? field.value.toString() : ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر الطالب" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {students?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem><FormLabel>من تاريخ</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="endDate" render={({ field }) => (
                    <FormItem><FormLabel>إلى تاريخ</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="reason" render={({ field }) => (
                  <FormItem><FormLabel>السبب</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>ملاحظات إضافية</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>حفظ الإجازة</Button>
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
                <TableHead className="text-right">الطالب</TableHead>
                <TableHead className="text-right">الفترة</TableHead>
                <TableHead className="text-right">السبب</TableHead>
                <TableHead className="text-right">الملاحظات</TableHead>
                <TableHead className="text-center w-24">إلغاء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && vacations?.map(vacation => (
                <TableRow key={vacation.id}>
                  <TableCell className="font-bold">{vacation.studentName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="w-4 h-4 text-muted-foreground" />
                      <span dir="ltr">{new Date(vacation.startDate).toLocaleDateString('ar-EG')} - {new Date(vacation.endDate).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </TableCell>
                  <TableCell>{vacation.reason}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{vacation.notes || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(vacation.id)} className="h-8 w-8 text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {vacations?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا يوجد إجازات مسجلة</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
