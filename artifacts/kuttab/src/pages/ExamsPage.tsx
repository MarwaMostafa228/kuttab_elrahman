import React, { useState } from "react";
import { 
  useListExams, useCreateExam, useDeleteExam, getListExamsQueryKey,
  useListExamResults, useCreateExamResult, getListExamResultsQueryKey,
  useListStudents
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Trash2, FileText } from "lucide-react";

const examSchema = z.object({
  title: z.string().min(2, "العنوان مطلوب"),
  type: z.string().min(2, "النوع مطلوب"),
  date: z.string().min(1, "التاريخ مطلوب"),
  description: z.string().optional(),
});

const resultSchema = z.object({
  examId: z.coerce.number().min(1, "اختر الاختبار"),
  studentId: z.coerce.number().min(1, "اختر الطالب"),
  score: z.coerce.number().min(0, "الدرجة مطلوبة").max(100),
  grade: z.string().optional(),
  notes: z.string().optional(),
});

export default function ExamsPage() {
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  
  const { data: exams, isLoading: examsLoading } = useListExams();
  const { data: results, isLoading: resultsLoading } = useListExamResults(
    { examId: selectedExamId || undefined },
    { query: { queryKey: ["/api/exam-results"] as const, enabled: true } }
  );
  const { data: students } = useListStudents();
  
  const createExamMutation = useCreateExam();
  const deleteExamMutation = useDeleteExam();
  const createResultMutation = useCreateExamResult();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isExamOpen, setIsExamOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);

  const formExam = useForm<z.infer<typeof examSchema>>({
    resolver: zodResolver(examSchema),
    defaultValues: { title: "", type: "اختبار", date: new Date().toISOString().split('T')[0], description: "" },
  });

  const formResult = useForm<z.infer<typeof resultSchema>>({
    resolver: zodResolver(resultSchema),
    defaultValues: { examId: 0, studentId: 0, score: 100, grade: "ممتاز", notes: "" },
  });

  const onExamSubmit = (values: z.infer<typeof examSchema>) => {
    createExamMutation.mutate({ data: values as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListExamsQueryKey() });
        setIsExamOpen(false);
        formExam.reset();
        toast({ title: "تمت الإضافة", description: "تم تسجيل الاختبار بنجاح" });
      }
    });
  };

  const onResultSubmit = (values: z.infer<typeof resultSchema>) => {
    createResultMutation.mutate({ data: values as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListExamResultsQueryKey() });
        setIsResultOpen(false);
        formResult.reset();
        toast({ title: "تم الرصد", description: "تم رصد النتيجة بنجاح" });
      }
    });
  };

  const handleDeleteExam = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الاختبار؟ (سيتم حذف جميع النتائج المرتبطة به)")) {
      deleteExamMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListExamsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListExamResultsQueryKey() });
          if (selectedExamId === id) setSelectedExamId(null);
          toast({ title: "تم الحذف", description: "تم حذف الاختبار" });
        }
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-serif font-bold text-primary">الاختبارات والمسابقات</h1>
        <p className="text-muted-foreground">إدارة السبر والاختبارات الدورية ورصد الدرجات</p>
      </div>

      <Tabs defaultValue="exams" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="exams">الاختبارات</TabsTrigger>
            <TabsTrigger value="results">رصد الدرجات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="exams" className="mt-0">
            <Dialog open={isExamOpen} onOpenChange={(open) => { setIsExamOpen(open); if(!open) formExam.reset(); }}>
              <DialogTrigger asChild>
                <Button className="gap-2 shrink-0">
                  <Plus className="w-4 h-4" /> إضافة اختبار
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>اختبار جديد</DialogTitle>
                </DialogHeader>
                <Form {...formExam}>
                  <form onSubmit={formExam.handleSubmit(onExamSubmit)} className="space-y-4">
                    <FormField control={formExam.control} name="title" render={({ field }) => (
                      <FormItem><FormLabel>العنوان (مثل: اختبار نهاية سورة البقرة)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={formExam.control} name="type" render={({ field }) => (
                        <FormItem>
                          <FormLabel>النوع</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="اختبار">اختبار</SelectItem>
                              <SelectItem value="مسابقة">مسابقة</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={formExam.control} name="date" render={({ field }) => (
                        <FormItem><FormLabel>التاريخ</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={formExam.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel>الوصف والمقرر</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={createExamMutation.isPending}>حفظ</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          <TabsContent value="results" className="mt-0">
            <Dialog open={isResultOpen} onOpenChange={(open) => { setIsResultOpen(open); if(!open) formResult.reset(); }}>
              <DialogTrigger asChild>
                <Button className="gap-2 shrink-0" variant="secondary">
                  <Plus className="w-4 h-4" /> رصد نتيجة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>رصد نتيجة طالب</DialogTitle>
                </DialogHeader>
                <Form {...formResult}>
                  <form onSubmit={formResult.handleSubmit(onResultSubmit)} className="space-y-4">
                    <FormField control={formResult.control} name="examId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاختبار</FormLabel>
                        <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value ? field.value.toString() : ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="اختر الاختبار" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {exams?.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.title}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={formResult.control} name="studentId" render={({ field }) => (
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
                      <FormField control={formResult.control} name="score" render={({ field }) => (
                        <FormItem><FormLabel>الدرجة (من 100)</FormLabel><FormControl><Input type="number" min="0" max="100" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={formResult.control} name="grade" render={({ field }) => (
                        <FormItem><FormLabel>التقدير</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={formResult.control} name="notes" render={({ field }) => (
                      <FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={createResultMutation.isPending}>رصد</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </div>

        <TabsContent value="exams" className="mt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {!examsLoading && exams?.map(exam => (
              <Card key={exam.id} className="border-border shadow-sm hover-elevate">
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2">{exam.type}</Badge>
                    <CardTitle className="font-serif text-lg">{exam.title}</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteExam(exam.id)} className="h-8 w-8 text-red-600 hover:bg-red-50 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="text-muted-foreground flex justify-between">
                    <span>التاريخ:</span>
                    <span className="font-medium text-foreground">{new Date(exam.date).toLocaleDateString('ar-EG')}</span>
                  </div>
                  {exam.description && (
                    <div className="text-muted-foreground pt-2 border-t mt-2">
                      {exam.description}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {exams?.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                لا يوجد اختبارات مسجلة
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="results" className="mt-0">
          <Card className="shadow-sm mb-4 border-none shadow-none bg-transparent">
            <div className="w-full max-w-sm mb-4">
              <Select value={selectedExamId ? selectedExamId.toString() : "all"} onValueChange={(v) => setSelectedExamId(v === "all" ? null : Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="تصفية حسب الاختبار" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">عرض جميع النتائج</SelectItem>
                  {exams?.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <CardContent className="p-0 bg-card rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-right">الطالب</TableHead>
                    <TableHead className="text-right">الاختبار</TableHead>
                    <TableHead className="text-center">الدرجة</TableHead>
                    <TableHead className="text-center">التقدير</TableHead>
                    <TableHead className="text-right">ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!resultsLoading && results?.map(result => (
                    <TableRow key={result.id}>
                      <TableCell className="font-bold">{result.studentName}</TableCell>
                      <TableCell>{result.examTitle}</TableCell>
                      <TableCell className="text-center font-mono font-bold text-lg">{result.score}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-primary text-primary-foreground">{result.grade || "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{result.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {results?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا يوجد نتائج مرصودة</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
