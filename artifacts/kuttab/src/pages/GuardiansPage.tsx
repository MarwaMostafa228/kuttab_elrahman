import React, { useState } from "react";
import { useListGuardians, useCreateGuardian, useUpdateGuardian, useListStudents, getListGuardiansQueryKey } from "@workspace/api-client-react";
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
import { Plus, Edit, Phone, Mail } from "lucide-react";

const guardianSchema = z.object({
  studentId: z.coerce.number().min(1, "اختر الطالب"),
  name: z.string().min(2, "الاسم مطلوب"),
  relationship: z.string().min(2, "صلة القرابة مطلوبة"),
  phone: z.string().optional(),
  email: z.string().email("بريد إلكتروني غير صالح").or(z.literal("")).optional(),
  notes: z.string().optional(),
});

export default function GuardiansPage() {
  const { data: guardians, isLoading } = useListGuardians();
  const { data: students } = useListStudents();
  
  const createMutation = useCreateGuardian();
  const updateMutation = useUpdateGuardian();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<any>(null);

  const form = useForm<z.infer<typeof guardianSchema>>({
    resolver: zodResolver(guardianSchema),
    defaultValues: { studentId: 0, name: "", relationship: "أب", phone: "", email: "", notes: "" },
  });

  const onSubmit = (values: z.infer<typeof guardianSchema>) => {
    if (editingGuardian) {
      updateMutation.mutate({ id: editingGuardian.id, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListGuardiansQueryKey() });
          setEditingGuardian(null);
          toast({ title: "تم التحديث", description: "تم تحديث بيانات ولي الأمر" });
        }
      });
    } else {
      createMutation.mutate({ data: values as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListGuardiansQueryKey() });
          setIsAddOpen(false);
          form.reset();
          toast({ title: "تمت الإضافة", description: "تمت إضافة ولي الأمر بنجاح" });
        }
      });
    }
  };

  const openEdit = (guardian: any) => {
    setEditingGuardian(guardian);
    form.reset({
      studentId: guardian.studentId,
      name: guardian.name,
      relationship: guardian.relationship,
      phone: guardian.phone || "",
      email: guardian.email || "",
      notes: guardian.notes || "",
    });
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">أولياء الأمور</h1>
          <p className="text-muted-foreground">بيانات التواصل مع أولياء أمور الطلاب</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) form.reset(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <Plus className="w-4 h-4" /> إضافة ولي أمر
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة ولي أمر</DialogTitle>
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
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>اسم ولي الأمر</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="relationship" render={({ field }) => (
                  <FormItem><FormLabel>صلة القرابة</FormLabel><FormControl><Input placeholder="أب، أم، أخ..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input dir="ltr" className="text-right" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" dir="ltr" className="text-right" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
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
                <TableHead className="text-right">ولي الأمر</TableHead>
                <TableHead className="text-right">صلة القرابة</TableHead>
                <TableHead className="text-right">الطالب</TableHead>
                <TableHead className="text-right">بيانات التواصل</TableHead>
                <TableHead className="text-center w-24">تعديل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && guardians?.map(guardian => (
                <TableRow key={guardian.id}>
                  <TableCell className="font-bold">{guardian.name}</TableCell>
                  <TableCell>{guardian.relationship}</TableCell>
                  <TableCell>{guardian.studentName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {guardian.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span dir="ltr">{guardian.phone}</span>
                        </div>
                      )}
                      {guardian.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span>{guardian.email}</span>
                        </div>
                      )}
                      {!guardian.phone && !guardian.email && <span className="text-muted-foreground">لا يوجد</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Dialog open={editingGuardian?.id === guardian.id} onOpenChange={(open) => { if(!open) setEditingGuardian(null); }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(guardian)} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md" dir="rtl">
                          <DialogHeader><DialogTitle>تعديل بيانات ولي الأمر</DialogTitle></DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                              <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>اسم ولي الأمر</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                              <FormField control={form.control} name="relationship" render={({ field }) => (
                                <FormItem><FormLabel>صلة القرابة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                              <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="phone" render={({ field }) => (
                                  <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input dir="ltr" className="text-right" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="email" render={({ field }) => (
                                  <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" dir="ltr" className="text-right" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                              </div>
                              <FormField control={form.control} name="notes" render={({ field }) => (
                                <FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>تحديث</Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {guardians?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا يوجد أولياء أمور مسجلين</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
