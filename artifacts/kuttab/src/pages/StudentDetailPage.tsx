import React, { useState } from "react";
import { useLocation } from "wouter";
import {
  useGetStudent,
  useUpdateStudent,
  useListGuardians,
  useCreateGuardian,
  useUpdateGuardian,
  useListPayments,
  useCreatePayment,
  useListMemorization,
  useCreateMemorization,
  useListAttendance,
  useRecordAttendance,
  useUpdateAttendance,
  useListCircles,
  useListCertificates,
  getGetStudentQueryKey,
  getListGuardiansQueryKey,
  getListPaymentsQueryKey,
  getListMemorizationQueryKey,
  getListAttendanceQueryKey,
  getListCertificatesQueryKey,
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  User,
  Phone,
  Calendar,
  BookOpen,
  CheckSquare,
  Wallet,
  MessageSquare,
  Plus,
  Edit,
  Save,
  Users,
  Award,
  Printer,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface Props {
  id: number;
}

const guardianSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  relationship: z.string().min(1, "صلة القرابة مطلوبة"),
  phone: z.string().optional(),
  email: z.string().optional(),
});

const memoSchema = z.object({
  surahName: z.string().min(1, "السورة مطلوبة"),
  fromVerse: z.coerce.number().min(1),
  toVerse: z.coerce.number().min(1),
  rating: z.string().min(1, "التقييم مطلوب"),
  date: z.string().min(1),
  notes: z.string().optional(),
});

const paymentSchema = z.object({
  amount: z.coerce.number().min(1, "المبلغ مطلوب"),
  month: z.string().min(1, "الشهر مطلوب"),
  notes: z.string().optional(),
  paidAt: z.string().optional(),
});

const attendanceSchema = z.object({
  date: z.string().min(1, "التاريخ مطلوب"),
  status: z.string().min(1, "الحالة مطلوبة"),
  circleId: z.coerce.number().optional().nullable(),
  notes: z.string().optional(),
});

const RATINGS = ["ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"];
const STATUSES = ["حاضر", "غائب", "متأخر", "معذور"];
const RELATIONSHIPS = ["الأب", "الأم", "الأخ", "الأخت", "الجد", "العم", "ولي الأمر"];

const getRatingColor = (r: string) => {
  switch (r) {
    case "ممتاز": return "bg-green-100 text-green-800 border-green-200";
    case "جيد جداً": return "bg-teal-100 text-teal-800 border-teal-200";
    case "جيد": return "bg-blue-100 text-blue-800 border-blue-200";
    case "مقبول": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "ضعيف": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusColor = (s: string) => {
  switch (s) {
    case "حاضر": return "bg-green-100 text-green-800";
    case "غائب": return "bg-red-100 text-red-800";
    case "متأخر": return "bg-yellow-100 text-yellow-800";
    case "معذور": return "bg-blue-100 text-blue-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export default function StudentDetailPage({ id }: Props) {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.slice(0, 7);

  const { data: student, isLoading } = useGetStudent(id);
  const { data: guardiansData } = useListGuardians({ studentId: id });
  const { data: payments } = useListPayments({ studentId: id });
  const { data: memorization } = useListMemorization({ studentId: id });
  const { data: attendance } = useListAttendance({ studentId: id });
  const { data: circles } = useListCircles();
  const { data: certificates } = useListCertificates(
    { studentId: id },
    { query: { queryKey: getListCertificatesQueryKey({ studentId: id }) as readonly unknown[], enabled: true } }
  );

  const updateMutation = useUpdateStudent();
  const createGuardianMutation = useCreateGuardian();
  const updateGuardianMutation = useUpdateGuardian();
  const createPaymentMutation = useCreatePayment();
  const createMemoMutation = useCreateMemorization();
  const createAttendanceMutation = useRecordAttendance();
  const updateAttendanceMutation = useUpdateAttendance();

  const [sheikhNotesDraft, setSheikhNotesDraft] = useState<string | null>(null);
  const [guardianNotesDraft, setGuardianNotesDraft] = useState<string | null>(null);
  const [isGuardianDialogOpen, setIsGuardianDialogOpen] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<any>(null);
  const [isMemoDialogOpen, setIsMemoDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);

  const guardianForm = useForm<z.infer<typeof guardianSchema>>({
    resolver: zodResolver(guardianSchema),
    defaultValues: { name: "", relationship: "الأب", phone: "", email: "" },
  });

  const memoForm = useForm<z.infer<typeof memoSchema>>({
    resolver: zodResolver(memoSchema),
    defaultValues: { surahName: "", fromVerse: 1, toVerse: 1, rating: "جيد", date: today, notes: "" },
  });

  const paymentForm = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 200, month: currentMonth, notes: "", paidAt: today },
  });

  const attendanceForm = useForm<z.infer<typeof attendanceSchema>>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: { date: today, status: "حاضر", circleId: null, notes: "" },
  });

  const invalidateStudent = () => qc.invalidateQueries({ queryKey: getGetStudentQueryKey(id) });

  const saveSheikhNotes = () => {
    if (sheikhNotesDraft === null) return;
    updateMutation.mutate({ id, data: { notes: sheikhNotesDraft } as any }, {
      onSuccess: () => {
        invalidateStudent();
        setSheikhNotesDraft(null);
        toast({ title: "تم الحفظ", description: "تم حفظ ملاحظات الشيخ" });
      }
    });
  };

  const saveGuardianNotes = () => {
    if (guardianNotesDraft === null) return;
    updateMutation.mutate({ id, data: { guardianNotes: guardianNotesDraft } as any }, {
      onSuccess: () => {
        invalidateStudent();
        setGuardianNotesDraft(null);
        toast({ title: "تم الحفظ", description: "تم حفظ ملاحظات ولي الأمر" });
      }
    });
  };

  const onGuardianSubmit = (values: z.infer<typeof guardianSchema>) => {
    if (editingGuardian) {
      updateGuardianMutation.mutate({ id: editingGuardian.id, data: values }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListGuardiansQueryKey({ studentId: id }) });
          setEditingGuardian(null);
          setIsGuardianDialogOpen(false);
          guardianForm.reset();
          toast({ title: "تم التحديث" });
        }
      });
    } else {
      createGuardianMutation.mutate({ data: { ...values, studentId: id } as any }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListGuardiansQueryKey({ studentId: id }) });
          setIsGuardianDialogOpen(false);
          guardianForm.reset();
          toast({ title: "تمت الإضافة", description: "تمت إضافة ولي الأمر" });
        }
      });
    }
  };

  const onMemoSubmit = (values: z.infer<typeof memoSchema>) => {
    createMemoMutation.mutate({ data: { ...values, studentId: id } as any }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListMemorizationQueryKey({ studentId: id }) });
        setIsMemoDialogOpen(false);
        memoForm.reset({ surahName: "", fromVerse: 1, toVerse: 1, rating: "جيد", date: today, notes: "" });
        toast({ title: "تم الحفظ", description: "تمت إضافة سجل التسميع" });
      }
    });
  };

  const onPaymentSubmit = (values: z.infer<typeof paymentSchema>) => {
    createPaymentMutation.mutate({ data: { ...values, studentId: id } as any }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListPaymentsQueryKey({ studentId: id }) });
        setIsPaymentDialogOpen(false);
        paymentForm.reset({ amount: 200, month: currentMonth, notes: "", paidAt: today });
        toast({ title: "تم الحفظ", description: "تم تسجيل الدفعة" });
      }
    });
  };

  const onAttendanceSubmit = (values: z.infer<typeof attendanceSchema>) => {
    createAttendanceMutation.mutate({ data: { ...values, studentId: id, circleId: values.circleId ?? undefined } as any }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAttendanceQueryKey({ studentId: id }) });
        setIsAttendanceDialogOpen(false);
        attendanceForm.reset({ date: today, status: "حاضر", circleId: null, notes: "" });
        toast({ title: "تم التسجيل", description: "تم تسجيل الحضور" });
      }
    });
  };

  const thisMonthPayments = payments?.filter(p => p.month === currentMonth) ?? [];
  const thisMonthTotal = thisMonthPayments.reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : parseFloat(p.amount as string)), 0);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Spinner className="w-8 h-8 text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-muted-foreground">الطالب غير موجود</div>
      </DashboardLayout>
    );
  }

  const guardian = guardiansData?.[0];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/students")} className="text-muted-foreground hover:text-primary">
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-serif font-bold text-primary">{student.name}</h1>
          <p className="text-muted-foreground text-sm">ملف الطالب الشخصي</p>
        </div>
        <span className="font-mono text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full font-bold" dir="ltr">
          {student.studentCode}
        </span>
      </div>

      {/* Top info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">الحلقة</span>
            </div>
            <p className="font-bold text-primary">{student.circleName || "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/10 border-secondary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="w-4 h-4 text-secondary" />
              <span className="text-xs text-muted-foreground">رقم الهاتف</span>
            </div>
            <p className="font-bold text-secondary" dir="ltr">{student.phone || "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">دفع هذا الشهر</span>
            </div>
            <p className="font-bold text-emerald-700">{thisMonthTotal > 0 ? `${thisMonthTotal} ر.س` : "لم يُسدَّد"}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">تاريخ الالتحاق</span>
            </div>
            <p className="font-bold text-blue-700">
              {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString('ar-EG') : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: guardian + notes */}
        <div className="space-y-6">
          {/* Guardian info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                ولي الأمر
              </CardTitle>
              <Dialog open={isGuardianDialogOpen} onOpenChange={(o) => { setIsGuardianDialogOpen(o); if (!o) { setEditingGuardian(null); guardianForm.reset(); } }}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={() => {
                    if (guardian) {
                      setEditingGuardian(guardian);
                      guardianForm.reset({ name: guardian.name, relationship: guardian.relationship, phone: guardian.phone || "", email: guardian.email || "" });
                    }
                    setIsGuardianDialogOpen(true);
                  }}>
                    {guardian ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>{editingGuardian ? "تعديل ولي الأمر" : "إضافة ولي أمر"}</DialogTitle>
                  </DialogHeader>
                  <Form {...guardianForm}>
                    <form onSubmit={guardianForm.handleSubmit(onGuardianSubmit)} className="space-y-4">
                      <FormField control={guardianForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>الاسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={guardianForm.control} name="relationship" render={({ field }) => (
                        <FormItem>
                          <FormLabel>صلة القرابة</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              {RELATIONSHIPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={guardianForm.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input {...field} dir="ltr" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" className="w-full" disabled={createGuardianMutation.isPending || updateGuardianMutation.isPending}>
                        {editingGuardian ? "تحديث" : "إضافة"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="pt-0">
              {guardian ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">الاسم</span>
                    <span className="font-medium">{guardian.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">الصلة</span>
                    <Badge variant="outline">{guardian.relationship}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">الهاتف</span>
                    <span className="font-medium" dir="ltr">{guardian.phone || "—"}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-3">لم يُضف ولي أمر بعد</p>
              )}
            </CardContent>
          </Card>

          {/* Sheikh notes */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                ملاحظات الشيخ
                <span className="text-xs font-normal text-muted-foreground">(يراها ولي الأمر والطالب)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <Textarea
                value={sheikhNotesDraft !== null ? sheikhNotesDraft : (student.notes || "")}
                onChange={(e) => setSheikhNotesDraft(e.target.value)}
                placeholder="اكتب ملاحظاتك هنا..."
                className="resize-none min-h-[100px] text-sm"
                rows={4}
              />
              {sheikhNotesDraft !== null && (
                <Button size="sm" className="w-full gap-2" onClick={saveSheikhNotes} disabled={updateMutation.isPending}>
                  <Save className="w-4 h-4" />
                  حفظ الملاحظات
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Guardian notes */}
          <Card className="shadow-sm border-secondary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-secondary" />
                ملاحظات ولي الأمر
                <span className="text-xs font-normal text-muted-foreground">(يراها الشيخ)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <Textarea
                value={guardianNotesDraft !== null ? guardianNotesDraft : (student.guardianNotes || "")}
                onChange={(e) => setGuardianNotesDraft(e.target.value)}
                placeholder="ملاحظات ولي الأمر للشيخ..."
                className="resize-none min-h-[100px] text-sm"
                rows={4}
              />
              {guardianNotesDraft !== null && (
                <Button size="sm" variant="secondary" className="w-full gap-2" onClick={saveGuardianNotes} disabled={updateMutation.isPending}>
                  <Save className="w-4 h-4" />
                  حفظ الملاحظات
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right columns: memorization + attendance + payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Memorization */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                سجل التسميع
              </CardTitle>
              <Dialog open={isMemoDialogOpen} onOpenChange={setIsMemoDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1 text-xs h-8">
                    <Plus className="w-3.5 h-3.5" /> إضافة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader><DialogTitle>إضافة سجل تسميع</DialogTitle></DialogHeader>
                  <Form {...memoForm}>
                    <form onSubmit={memoForm.handleSubmit(onMemoSubmit)} className="space-y-4">
                      <FormField control={memoForm.control} name="surahName" render={({ field }) => (
                        <FormItem><FormLabel>السورة</FormLabel><FormControl><Input placeholder="مثال: البقرة" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={memoForm.control} name="fromVerse" render={({ field }) => (
                          <FormItem><FormLabel>من آية</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={memoForm.control} name="toVerse" render={({ field }) => (
                          <FormItem><FormLabel>إلى آية</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={memoForm.control} name="rating" render={({ field }) => (
                          <FormItem>
                            <FormLabel>التقييم</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>{RATINGS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={memoForm.control} name="date" render={({ field }) => (
                          <FormItem><FormLabel>التاريخ</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <Button type="submit" className="w-full" disabled={createMemoMutation.isPending}>حفظ</Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-right text-xs">التاريخ</TableHead>
                    <TableHead className="text-right text-xs">السورة</TableHead>
                    <TableHead className="text-right text-xs">الآيات</TableHead>
                    <TableHead className="text-center text-xs">التقييم</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memorization?.slice(0, 10).map(rec => (
                    <TableRow key={rec.id}>
                      <TableCell className="text-xs">{new Date(rec.date).toLocaleDateString('ar-EG')}</TableCell>
                      <TableCell className="font-medium text-sm">{rec.surahName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground" dir="ltr">{rec.fromVerse}–{rec.toVerse}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-xs ${getRatingColor(rec.rating)}`}>{rec.rating}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!memorization || memorization.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">لا يوجد سجل تسميع</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Attendance */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-secondary" />
                سجل الحضور والغياب
              </CardTitle>
              <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1 text-xs h-8">
                    <Plus className="w-3.5 h-3.5" /> تسجيل
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader><DialogTitle>تسجيل الحضور</DialogTitle></DialogHeader>
                  <Form {...attendanceForm}>
                    <form onSubmit={attendanceForm.handleSubmit(onAttendanceSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={attendanceForm.control} name="date" render={({ field }) => (
                          <FormItem><FormLabel>التاريخ</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={attendanceForm.control} name="status" render={({ field }) => (
                          <FormItem>
                            <FormLabel>الحالة</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={attendanceForm.control} name="circleId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>الحلقة (اختياري)</FormLabel>
                          <Select onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))} value={field.value?.toString() || "none"}>
                            <FormControl><SelectTrigger><SelectValue placeholder="اختر الحلقة" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              {circles?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" className="w-full" disabled={createAttendanceMutation.isPending}>تسجيل</Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-right text-xs">التاريخ</TableHead>
                    <TableHead className="text-right text-xs">الحلقة</TableHead>
                    <TableHead className="text-center text-xs">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance?.slice(0, 10).map(rec => (
                    <TableRow key={rec.id}>
                      <TableCell className="text-xs">{new Date(rec.date).toLocaleDateString('ar-EG')}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{rec.circleName || "—"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-xs border-transparent ${getStatusColor(rec.status)}`}>{rec.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!attendance || attendance.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-sm">لا يوجد سجل حضور</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Payments this month */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                سجل الدفعات
              </CardTitle>
              <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1 text-xs h-8">
                    <Plus className="w-3.5 h-3.5" /> تسجيل دفعة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader><DialogTitle>تسجيل دفعة</DialogTitle></DialogHeader>
                  <Form {...paymentForm}>
                    <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={paymentForm.control} name="amount" render={({ field }) => (
                          <FormItem><FormLabel>المبلغ (ر.س)</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={paymentForm.control} name="month" render={({ field }) => (
                          <FormItem><FormLabel>الشهر</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <FormField control={paymentForm.control} name="paidAt" render={({ field }) => (
                        <FormItem><FormLabel>تاريخ الدفع</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={paymentForm.control} name="notes" render={({ field }) => (
                        <FormItem><FormLabel>ملاحظات (اختياري)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" className="w-full" disabled={createPaymentMutation.isPending}>تسجيل</Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-right text-xs">الشهر</TableHead>
                    <TableHead className="text-right text-xs">تاريخ الدفع</TableHead>
                    <TableHead className="text-right text-xs">المبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments?.slice(0, 8).map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">{p.month}</TableCell>
                      <TableCell className="text-xs">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('ar-EG') : "—"}</TableCell>
                      <TableCell className="font-medium text-emerald-700">{typeof p.amount === 'number' ? p.amount : parseFloat(p.amount as string)} ر.س</TableCell>
                    </TableRow>
                  ))}
                  {(!payments || payments.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-sm">لا يوجد سجل دفعات</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* ── شهادات الطالب ── */}
        {certificates && certificates.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-secondary" />
              <h2 className="text-lg font-bold text-primary">شهادات التكريم</h2>
              <span className="text-xs text-muted-foreground">({certificates.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificates.map(cert => (
                <CertificateCard key={cert.id} cert={cert} studentName={student?.name ?? ""} />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function CertificateCard({ cert, studentName }: { cert: { id: number; title: string; description?: string | null; issuedAt: string }; studentName: string }) {
  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const dateStr = new Date(cert.issuedAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
    win.document.write(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"/>
<title>شهادة - ${studentName}</title>
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #f7f3ec; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Cairo', sans-serif; }
  .cert { width: 210mm; min-height: 148mm; background: #fff; padding: 8mm; position: relative; }
  .outer-border { border: 4px double #1a4a30; padding: 6mm; height: 100%; position: relative; }
  .inner-border { border: 1.5px solid #d4a017; padding: 6mm; height: 100%; text-align: center; }
  .corner { position: absolute; width: 24px; height: 24px; }
  .corner.tl { top: 4px; right: 4px; border-top: 2px solid #d4a017; border-right: 2px solid #d4a017; }
  .corner.tr { top: 4px; left: 4px; border-top: 2px solid #d4a017; border-left: 2px solid #d4a017; }
  .corner.bl { bottom: 4px; right: 4px; border-bottom: 2px solid #d4a017; border-right: 2px solid #d4a017; }
  .corner.br { bottom: 4px; left: 4px; border-bottom: 2px solid #d4a017; border-left: 2px solid #d4a017; }
  .logo { font-family: 'Amiri', serif; font-size: 32px; font-weight: 700; color: #1a4a30; margin-bottom: 2mm; }
  .subtitle { font-size: 12px; color: #555; letter-spacing: 0.5px; margin-bottom: 4mm; }
  .divider { width: 80%; height: 1px; background: linear-gradient(to left, transparent, #d4a017, transparent); margin: 3mm auto; }
  .basmala { font-family: 'Amiri', serif; font-size: 18px; color: #1a4a30; margin: 3mm 0; }
  .witness { font-size: 14px; color: #333; margin: 3mm 0; }
  .student-name { font-family: 'Amiri', serif; font-size: 28px; font-weight: 700; color: #1a4a30; margin: 3mm 0; border-bottom: 2px solid #d4a017; display: inline-block; padding-bottom: 1mm; }
  .cert-title { font-size: 20px; font-weight: 700; color: #d4a017; margin: 3mm 0; }
  .desc { font-size: 13px; color: #555; margin: 2mm 0; line-height: 1.6; max-width: 85%; display: inline-block; }
  .date-row { font-size: 12px; color: #777; margin-top: 5mm; }
  .seal { width: 60px; height: 60px; border-radius: 50%; border: 3px solid #1a4a30; display: inline-flex; align-items: center; justify-content: center; margin-top: 4mm; font-family: 'Amiri', serif; font-size: 11px; color: #1a4a30; line-height: 1.3; }
  @media print { body { background: white; } .cert { box-shadow: none; } }
</style>
</head>
<body>
<div class="cert">
  <div class="outer-border">
    <div class="inner-border">
      <div class="corner tl"></div><div class="corner tr"></div>
      <div class="corner bl"></div><div class="corner br"></div>
      <div class="logo">كُتَّاب الرحمن</div>
      <div class="subtitle">دار تحفيظ القرآن الكريم</div>
      <div class="divider"></div>
      <div class="basmala">بسم الله الرحمن الرحيم</div>
      <div class="divider"></div>
      <div class="witness">تشهد إدارة كُتَّاب الرحمن بأن الطالب/الطالبة</div>
      <div class="student-name">${studentName}</div>
      <div class="cert-title">${cert.title}</div>
      ${cert.description ? `<div class="desc">${cert.description}</div>` : ""}
      <div class="date-row">بتاريخ: ${dateStr}</div>
      <div class="seal">ختم<br/>المؤسسة</div>
    </div>
  </div>
</div>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`);
    win.document.close();
  };

  const dateStr = new Date(cert.issuedAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg print:shadow-none" style={{ background: "linear-gradient(135deg, #f7f3ec 0%, #fff 50%, #f7f3ec 100%)" }}>
      <div className="border-4 border-double border-primary m-1 rounded-lg">
        <div className="border border-secondary/60 m-1.5 rounded p-5 text-center relative">
          {/* Corner ornaments */}
          <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-secondary rounded-tr" />
          <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-secondary rounded-tl" />
          <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-secondary rounded-br" />
          <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-secondary rounded-bl" />

          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <Award className="w-5 h-5 text-secondary" />
            <span className="font-serif text-xl font-bold text-primary" style={{ fontFamily: "Amiri, serif" }}>كُتَّاب الرحمن</span>
            <Award className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-[10px] text-muted-foreground tracking-wider mb-2">دار تحفيظ القرآن الكريم</p>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-secondary to-transparent mb-2" />
          <p className="text-sm text-primary mb-2" style={{ fontFamily: "Amiri, serif" }}>بسم الله الرحمن الرحيم</p>
          <div className="h-px bg-gradient-to-r from-transparent via-secondary to-transparent mb-3" />

          {/* Witness text */}
          <p className="text-xs text-muted-foreground mb-1">تشهد إدارة كُتَّاب الرحمن بأن الطالب/الطالبة</p>
          <p className="text-2xl font-bold text-primary border-b-2 border-secondary inline-block pb-0.5 mb-2" style={{ fontFamily: "Amiri, serif" }}>
            {studentName}
          </p>

          {/* Title */}
          <p className="text-base font-bold text-secondary mt-1">{cert.title}</p>

          {/* Description */}
          {cert.description && (
            <p className="text-xs text-muted-foreground mt-1 mx-4 leading-relaxed">{cert.description}</p>
          )}

          {/* Date */}
          <p className="text-[11px] text-muted-foreground mt-3">بتاريخ: {dateStr}</p>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary border border-primary/20 hover:border-primary/50 rounded-full px-3 py-1 transition-colors"
          >
            <Printer className="w-3 h-3" />
            طباعة الشهادة
          </button>
        </div>
      </div>
    </div>
  );
}
