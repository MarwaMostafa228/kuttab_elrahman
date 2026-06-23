import React, { useState } from "react";
import { useListCircles, useCreateCircle, useUpdateCircle, useDeleteCircle, getListCirclesQueryKey } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, Clock, Video } from "lucide-react";

const circleSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  description: z.string().optional(),
  schedule: z.string().optional(),
  onlineLink: z.string().url("رابط غير صالح").or(z.literal("")).optional(),
});

export default function CirclesPage() {
  const { data: circles, isLoading } = useListCircles();
  const createMutation = useCreateCircle();
  const updateMutation = useUpdateCircle();
  const deleteMutation = useDeleteCircle();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCircle, setEditingCircle] = useState<any>(null);

  const form = useForm<z.infer<typeof circleSchema>>({
    resolver: zodResolver(circleSchema),
    defaultValues: { name: "", description: "", schedule: "", onlineLink: "" },
  });

  const onSubmit = (values: z.infer<typeof circleSchema>) => {
    if (editingCircle) {
      updateMutation.mutate({ id: editingCircle.id, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCirclesQueryKey() });
          setEditingCircle(null);
          toast({ title: "تم التحديث", description: "تم تحديث بيانات الحلقة بنجاح" });
        }
      });
    } else {
      createMutation.mutate({ data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCirclesQueryKey() });
          setIsAddOpen(false);
          form.reset();
          toast({ title: "تمت الإضافة", description: "تمت إضافة الحلقة بنجاح" });
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الحلقة؟")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCirclesQueryKey() });
          toast({ title: "تم الحذف", description: "تم حذف الحلقة بنجاح" });
        }
      });
    }
  };

  const openEdit = (circle: any) => {
    setEditingCircle(circle);
    form.reset({
      name: circle.name,
      description: circle.description || "",
      schedule: circle.schedule || "",
      onlineLink: circle.onlineLink || "",
    });
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">الحلقات القرآنية</h1>
          <p className="text-muted-foreground">إدارة حلقات التحفيظ ومواعيدها</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) form.reset(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="btn-add-circle">
              <Plus className="w-4 h-4" /> إضافة حلقة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة حلقة جديدة</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>اسم الحلقة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="schedule" render={({ field }) => (
                  <FormItem><FormLabel>الموعد</FormLabel><FormControl><Input placeholder="مثال: الأحد والثلاثاء بعد العصر" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>الوصف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="onlineLink" render={({ field }) => (
                  <FormItem><FormLabel>رابط اللقاء (Zoom/Meet)</FormLabel><FormControl><Input dir="ltr" className="text-left" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>حفظ</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!isLoading && circles?.map(circle => (
          <Card key={circle.id} className="border-border shadow-sm hover-elevate transition-all overflow-hidden flex flex-col">
            <div className="h-2 w-full bg-secondary"></div>
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-xl text-primary">{circle.name}</CardTitle>
              {circle.description && <p className="text-sm text-muted-foreground">{circle.description}</p>}
            </CardHeader>
            <CardContent className="space-y-3 flex-1">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{circle.studentCount || 0} طلاب</span>
              </div>
              {circle.schedule && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{circle.schedule}</span>
                </div>
              )}
              {circle.onlineLink && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Video className="w-4 h-4" />
                  <a href={circle.onlineLink} target="_blank" rel="noreferrer" className="hover:underline line-clamp-1" dir="ltr">{circle.onlineLink}</a>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-muted/30 p-3 flex justify-end gap-2 border-t">
              <Dialog open={editingCircle?.id === circle.id} onOpenChange={(open) => { if(!open) setEditingCircle(null); }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => openEdit(circle)} className="gap-1 h-8">
                    <Edit className="w-3 h-3" /> تعديل
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader><DialogTitle>تعديل الحلقة</DialogTitle></DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>اسم الحلقة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="schedule" render={({ field }) => (
                        <FormItem><FormLabel>الموعد</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="onlineLink" render={({ field }) => (
                        <FormItem><FormLabel>رابط اللقاء</FormLabel><FormControl><Input dir="ltr" className="text-left" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" className="w-full" disabled={updateMutation.isPending}>تحديث</Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(circle.id)} className="gap-1 h-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-3 h-3" /> حذف
              </Button>
            </CardFooter>
          </Card>
        ))}
        {circles?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            لا توجد حلقات مسجلة بعد. انقر على "إضافة حلقة" للبدء.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
