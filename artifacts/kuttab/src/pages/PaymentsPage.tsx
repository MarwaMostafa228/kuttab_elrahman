import React, { useState } from "react";
import { useListPayments, useCreatePayment, useDeletePayment, useListStudents, getListPaymentsQueryKey } from "@workspace/api-client-react";
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
import { Plus, Trash2, Wallet } from "lucide-react";

const paymentSchema = z.object({
  studentId: z.coerce.number().min(1, "اختر الطالب"),
  amount: z.coerce.number().min(1, "المبلغ مطلوب"),
  month: z.string().min(2, "الشهر المستحق مطلوب"),
  notes: z.string().optional(),
  paidAt: z.string().optional(),
});

export default function PaymentsPage() {
  const [filterMonth, setFilterMonth] = useState("");
  const { data: payments, isLoading } = useListPayments({ month: filterMonth || undefined });
  const { data: students } = useListStudents();
  
  const createMutation = useCreatePayment();
  const deleteMutation = useDeletePayment();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { studentId: 0, amount: 100, month: new Date().toISOString().substring(0, 7), notes: "", paidAt: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = (values: z.infer<typeof paymentSchema>) => {
    createMutation.mutate({ data: values as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
        setIsAddOpen(false);
        form.reset();
        toast({ title: "تمت الإضافة", description: "تم تسجيل الدفعة بنجاح" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الدفعة؟")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
          toast({ title: "تم الحذف", description: "تم حذف الدفعة بنجاح" });
        }
      });
    }
  };

  const totalAmount = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">الدفعات المالية</h1>
          <p className="text-muted-foreground">تسجيل اشتراكات ورسوم الطلاب</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input 
            type="month" 
            value={filterMonth} 
            onChange={(e) => setFilterMonth(e.target.value)} 
            className="w-full md:w-48"
          />
          
          <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) form.reset(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0">
                <Plus className="w-4 h-4" /> سند قبض
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>تسجيل دفعة طالب</DialogTitle>
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
                    <FormField control={form.control} name="amount" render={({ field }) => (
                      <FormItem><FormLabel>المبلغ</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="month" render={({ field }) => (
                      <FormItem><FormLabel>عن شهر</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="paidAt" render={({ field }) => (
                      <FormItem><FormLabel>تاريخ الدفع</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="notes" render={({ field }) => (
                      <FormItem><FormLabel>البيان / الملاحظات</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>حفظ السند</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-emerald-50 border-emerald-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-800 mb-1">إجمالي المقبوضات (للفلتر الحالي)</p>
              <h3 className="text-3xl font-bold text-emerald-900">{totalAmount} <span className="text-lg font-normal">ر.س</span></h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-200/50 flex items-center justify-center text-emerald-700">
              <Wallet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الطالب</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">عن شهر</TableHead>
                <TableHead className="text-right">البيان</TableHead>
                <TableHead className="text-center w-24">إلغاء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && payments?.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell className="text-sm">{new Date(payment.paidAt).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell className="font-bold">{payment.studentName}</TableCell>
                  <TableCell className="text-emerald-700 font-bold">{payment.amount}</TableCell>
                  <TableCell dir="ltr" className="text-right">{payment.month}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{payment.notes || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(payment.id)} className="h-8 w-8 text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {payments?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا يوجد دفعات مسجلة</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
