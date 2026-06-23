import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useSheikhLogin, useSheikhRegister, useStudentLogin } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, ChevronLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const sheikhLoginSchema = z.object({
  email: z.string().email({ message: "بريد إلكتروني غير صالح" }),
  password: z.string().min(1, { message: "كلمة المرور مطلوبة" }),
});

const sheikhRegisterSchema = z.object({
  name: z.string().min(2, { message: "الاسم مطلوب" }),
  email: z.string().email({ message: "بريد إلكتروني غير صالح" }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }),
  activationCode: z.string().min(1, { message: "كود التفعيل مطلوب" }),
});

const studentLoginSchema = z.object({
  studentCode: z.string().min(1, { message: "كود الطالب مطلوب" }),
});

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showRegister, setShowRegister] = useState(false);

  const sheikhLoginMutation = useSheikhLogin();
  const sheikhRegisterMutation = useSheikhRegister();
  const studentLoginMutation = useStudentLogin();

  const formSheikhLogin = useForm<z.infer<typeof sheikhLoginSchema>>({
    resolver: zodResolver(sheikhLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const formSheikhRegister = useForm<z.infer<typeof sheikhRegisterSchema>>({
    resolver: zodResolver(sheikhRegisterSchema),
    defaultValues: { name: "", email: "", password: "", activationCode: "" },
  });

  const formStudentLogin = useForm<z.infer<typeof studentLoginSchema>>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: { studentCode: "" },
  });

  const onSheikhLogin = (values: z.infer<typeof sheikhLoginSchema>) => {
    sheikhLoginMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data);
        setLocation("/students");
      },
      onError: () => {
        toast({ variant: "destructive", title: "خطأ في تسجيل الدخول", description: "تأكد من البريد الإلكتروني وكلمة المرور" });
      }
    });
  };

  const onSheikhRegister = (values: z.infer<typeof sheikhRegisterSchema>) => {
    sheikhRegisterMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data);
        setLocation("/students");
      },
      onError: () => {
        toast({ variant: "destructive", title: "خطأ في التسجيل", description: "تأكد من البيانات وكود التفعيل" });
      }
    });
  };

  const onStudentLogin = (values: z.infer<typeof studentLoginSchema>) => {
    studentLoginMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data);
        setLocation("/student-portal");
      },
      onError: () => {
        toast({ variant: "destructive", title: "خطأ في تسجيل الدخول", description: "كود الطالب غير صحيح" });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] p-4" dir="rtl">
      <div className="w-full max-w-md text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl border-4 border-background">
          <BookOpen className="w-10 h-10 text-secondary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-2">كُتَّاب الرحمن</h1>
        <p className="text-muted-foreground text-lg">نظام إدارة دار تحفيظ القرآن الكريم</p>
      </div>

      <Card className="w-full max-w-md border-primary/10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        <CardHeader className="bg-primary/5 border-b border-primary/10 pb-6 rounded-t-lg">
          <CardTitle className="text-center font-serif text-2xl text-primary">
            {showRegister ? "تسجيل شيخ جديد" : "بوابة الدخول"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {showRegister ? (
            <div className="space-y-4">
              <button
                onClick={() => setShowRegister(false)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                العودة لتسجيل الدخول
              </button>
              <Form {...formSheikhRegister}>
                <form onSubmit={formSheikhRegister.handleSubmit(onSheikhRegister)} className="space-y-4">
                  <FormField control={formSheikhRegister.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الكامل</FormLabel>
                      <FormControl><Input placeholder="الشيخ محمد..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={formSheikhRegister.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl><Input placeholder="email@example.com" type="email" dir="ltr" className="text-left" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={formSheikhRegister.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور</FormLabel>
                      <FormControl><Input placeholder="••••••••" type="password" dir="ltr" className="text-left" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={formSheikhRegister.control} name="activationCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>كود التفعيل (من الإدارة)</FormLabel>
                      <FormControl><Input placeholder="sheikh@119955" dir="ltr" className="text-left" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full font-bold text-base h-12" disabled={sheikhRegisterMutation.isPending} data-testid="btn-register-sheikh">
                    {sheikhRegisterMutation.isPending ? "جاري التسجيل..." : "تسجيل كشيخ جديد"}
                  </Button>
                </form>
              </Form>
            </div>
          ) : (
            <Tabs defaultValue="sheikh" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted">
                <TabsTrigger value="sheikh" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">الشيخ</TabsTrigger>
                <TabsTrigger value="student" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">الطالب</TabsTrigger>
              </TabsList>

              <TabsContent value="sheikh" className="space-y-4 mt-0">
                <Form {...formSheikhLogin}>
                  <form onSubmit={formSheikhLogin.handleSubmit(onSheikhLogin)} className="space-y-4">
                    <FormField control={formSheikhLogin.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني</FormLabel>
                        <FormControl><Input placeholder="email@example.com" type="email" dir="ltr" className="text-left" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={formSheikhLogin.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور</FormLabel>
                        <FormControl><Input placeholder="••••••••" type="password" dir="ltr" className="text-left" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full font-bold text-base h-12" disabled={sheikhLoginMutation.isPending} data-testid="btn-login-sheikh">
                      {sheikhLoginMutation.isPending ? "جاري الدخول..." : "دخول"}
                    </Button>
                  </form>
                </Form>
                <div className="text-center pt-2 border-t border-border">
                  <button
                    onClick={() => setShowRegister(true)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    شيخ جديد؟ <span className="text-primary font-medium underline">سجّل حساباً</span>
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="student" className="space-y-4 mt-0">
                <div className="bg-secondary/10 p-4 rounded-lg mb-4 text-center">
                  <p className="text-sm text-primary">أدخل كود الطالب الخاص بك لمتابعة حفظك وحضورك</p>
                </div>
                <Form {...formStudentLogin}>
                  <form onSubmit={formStudentLogin.handleSubmit(onStudentLogin)} className="space-y-4">
                    <FormField control={formStudentLogin.control} name="studentCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>كود الطالب</FormLabel>
                        <FormControl><Input placeholder="KR-XXXX" dir="ltr" className="text-center text-lg font-bold tracking-widest uppercase" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" variant="secondary" className="w-full font-bold text-base h-12" disabled={studentLoginMutation.isPending} data-testid="btn-login-student">
                      {studentLoginMutation.isPending ? "جاري الدخول..." : "دخول كطالب"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <p className="mt-8 text-sm text-muted-foreground">صُنع بعناية وإتقان لخدمة أهل القرآن</p>
    </div>
  );
}
