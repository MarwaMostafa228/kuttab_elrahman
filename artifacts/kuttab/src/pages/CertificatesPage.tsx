import React, { useState } from "react";
import { useListCertificates, useCreateCertificate, useDeleteCertificate, useListStudents, getListCertificatesQueryKey } from "@workspace/api-client-react";
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
import { Plus, Trash2, Award } from "lucide-react";

const certificateSchema = z.object({
  studentId: z.coerce.number().min(1, "اختر الطالب"),
  title: z.string().min(2, "عنوان الشهادة مطلوب"),
  description: z.string().optional(),
  issuedAt: z.string().min(1, "التاريخ مطلوب"),
});

export default function CertificatesPage() {
  const { data: certificates, isLoading } = useListCertificates();
  const { data: students } = useListStudents();
  
  const createMutation = useCreateCertificate();
  const deleteMutation = useDeleteCertificate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);

  const form = useForm<z.infer<typeof certificateSchema>>({
    resolver: zodResolver(certificateSchema),
    defaultValues: { studentId: 0, title: "شهادة إتمام جزء", description: "", issuedAt: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = (values: z.infer<typeof certificateSchema>) => {
    createMutation.mutate({ data: values as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCertificatesQueryKey() });
        setIsAddOpen(false);
        form.reset();
        toast({ title: "تمت الإضافة", description: "تم إصدار الشهادة بنجاح" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الشهادة؟")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCertificatesQueryKey() });
          toast({ title: "تم الحذف", description: "تم حذف الشهادة" });
        }
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">الشهادات والجوائز</h1>
          <p className="text-muted-foreground">سجل التكريم والشهادات الممنوحة للطلاب</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) form.reset(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <Plus className="w-4 h-4" /> إصدار شهادة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>إصدار شهادة جديدة</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="studentId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الطالب المكرم</FormLabel>
                    <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value ? field.value.toString() : ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر الطالب" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {students?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>عنوان الشهادة / الجائزة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="issuedAt" render={({ field }) => (
                  <FormItem><FormLabel>تاريخ الإصدار</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>الوصف المكتوب في الشهادة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>إصدار</Button>
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
                <TableHead className="text-right w-16"></TableHead>
                <TableHead className="text-right">الطالب</TableHead>
                <TableHead className="text-right">عنوان الشهادة</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الوصف</TableHead>
                <TableHead className="text-center w-24">حذف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && certificates?.map(cert => (
                <TableRow key={cert.id}>
                  <TableCell>
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                      <Award className="w-4 h-4 text-secondary" />
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">{cert.studentName}</TableCell>
                  <TableCell className="text-primary font-medium">{cert.title}</TableCell>
                  <TableCell className="text-sm">{new Date(cert.issuedAt).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{cert.description || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(cert.id)} className="h-8 w-8 text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {certificates?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا يوجد شهادات مصدرة بعد</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
