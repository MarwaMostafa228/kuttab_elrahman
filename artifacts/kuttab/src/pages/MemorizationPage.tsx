import React, { useState } from "react";
import { useListMemorization, useCreateMemorization, useUpdateMemorization, useDeleteMemorization, useListStudents, getListMemorizationQueryKey } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Search } from "lucide-react";

const memorizationSchema = z.object({
  studentId: z.coerce.number().min(1, "اختر الطالب"),
  surahName: z.string().min(2, "اسم السورة مطلوب"),
  fromVerse: z.coerce.number().min(1, "من الآية مطلوب"),
  toVerse: z.coerce.number().min(1, "إلى الآية مطلوب"),
  rating: z.string().min(1, "التقييم مطلوب"),
  notes: z.string().optional(),
  date: z.string().min(1, "التاريخ مطلوب"),
});

const RATINGS = ["ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"];

export default function MemorizationPage() {
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const { data: records, isLoading } = useListMemorization({ date: filterDate });
  const { data: students } = useListStudents();
  
  const createMutation = useCreateMemorization();
  const updateMutation = useUpdateMemorization();
  const deleteMutation = useDeleteMemorization();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const form = useForm<z.infer<typeof memorizationSchema>>({
    resolver: zodResolver(memorizationSchema),
    defaultValues: { studentId: 0, surahName: "", fromVerse: 1, toVerse: 1, rating: "ممتاز", notes: "", date: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = (values: z.infer<typeof memorizationSchema>) => {
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data: { ...values, fromVerse: Number(values.fromVerse), toVerse: Number(values.toVerse) } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMemorizationQueryKey() });
          setEditingRecord(null);
          toast({ title: "تم التحديث", description: "تم تحديث السجل بنجاح" });
        }
      });
    } else {
      createMutation.mutate({ data: { ...values, fromVerse: Number(values.fromVerse), toVerse: Number(values.toVerse) } as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMemorizationQueryKey() });
          setIsAddOpen(false);
          form.reset();
          toast({ title: "تمت الإضافة", description: "تمت إضافة السجل بنجاح" });
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا السجل؟")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMemorizationQueryKey() });
          toast({ title: "تم الحذف", description: "تم حذف السجل بنجاح" });
        }
      });
    }
  };

  const openEdit = (record: any) => {
    setEditingRecord(record);
    form.reset({
      studentId: record.studentId,
      surahName: record.surahName,
      fromVerse: record.fromVerse,
      toVerse: record.toVerse,
      rating: record.rating,
      notes: record.notes || "",
      date: new Date(record.date).toISOString().split('T')[0],
    });
  };

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

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">متابعة الحفظ</h1>
          <p className="text-muted-foreground">سجل تسميع وحفظ الطلاب</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              type="date" 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)} 
              className="pr-9"
            />
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) form.reset(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0">
                <Plus className="w-4 h-4" /> تسميع جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة سجل تسميع</DialogTitle>
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
                  <FormField control={form.control} name="surahName" render={({ field }) => (
                    <FormItem><FormLabel>السورة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="fromVerse" render={({ field }) => (
                      <FormItem><FormLabel>من الآية</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="toVerse" render={({ field }) => (
                      <FormItem><FormLabel>إلى الآية</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="rating" render={({ field }) => (
                      <FormItem>
                        <FormLabel>التقييم</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="التقييم" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {RATINGS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem><FormLabel>التاريخ</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
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
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الطالب</TableHead>
                <TableHead className="text-right">السورة</TableHead>
                <TableHead className="text-right">الآيات</TableHead>
                <TableHead className="text-center">التقييم</TableHead>
                <TableHead className="text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && records?.map(record => (
                <TableRow key={record.id}>
                  <TableCell>{new Date(record.date).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell className="font-bold">{record.studentName}</TableCell>
                  <TableCell>{record.surahName}</TableCell>
                  <TableCell dir="ltr" className="text-right">{record.fromVerse} - {record.toVerse}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={getRatingColor(record.rating)}>{record.rating}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Dialog open={editingRecord?.id === record.id} onOpenChange={(open) => { if(!open) setEditingRecord(null); }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(record)} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md" dir="rtl">
                          <DialogHeader><DialogTitle>تعديل السجل</DialogTitle></DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                              <FormField control={form.control} name="surahName" render={({ field }) => (
                                <FormItem><FormLabel>السورة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                              <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="fromVerse" render={({ field }) => (
                                  <FormItem><FormLabel>من الآية</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="toVerse" render={({ field }) => (
                                  <FormItem><FormLabel>إلى الآية</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                              </div>
                              <FormField control={form.control} name="rating" render={({ field }) => (
                                <FormItem>
                                  <FormLabel>التقييم</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="التقييم" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                      {RATINGS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              <FormField control={form.control} name="notes" render={({ field }) => (
                                <FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>تحديث</Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(record.id)} className="h-8 w-8 text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {records?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا يوجد سجلات في هذا التاريخ</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
