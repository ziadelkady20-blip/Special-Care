"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, FormField,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/components/ui";
import { Plus, UserX, UserCheck, Pencil } from "lucide-react";
import { createUser, toggleUserStatus, updateUser } from "@/app/actions";
import type { AppRole } from "@/lib/permissions";

type EditableRole = Exclude<AppRole, "SUPER_ADMIN" | "PARENT">;
const userSchema = z.object({
  name: z.string().min(2, "الاسم قصير جدًا"),
  email: z.string().email("بريد غير صحيح"),
  phone: z.string().optional(),
  role: z.enum(["CENTER_ADMIN", "SPECIALIST", "DATA_ENTRY", "VIEWER"]),
  password: z.string().min(10, "10 أحرف على الأقل"),
});
type UserForm = z.infer<typeof userSchema>;

export const UsersClient = {
  AddButton: () => {
    const [open, setOpen] = React.useState(false);
    return <><Button size="md" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />إضافة مستخدم</Button><CreateUserDialog open={open} onClose={() => setOpen(false)} /></>;
  },
  EditButton: ({ user }: { user: { id: string; name: string; phone: string | null; role: AppRole } }) => {
    const [open, setOpen] = React.useState(false);
    if (user.role === "SUPER_ADMIN" || user.role === "PARENT") return <Button size="sm" variant="ghost" disabled><Pencil className="h-3.5 w-3.5" /> تعديل</Button>;
    const editableUser = { ...user, role: user.role as EditableRole };
    return <><Button size="sm" variant="ghost" onClick={() => setOpen(true)}><Pencil className="h-3.5 w-3.5" /> تعديل</Button><EditUserDialog open={open} onClose={() => setOpen(false)} user={editableUser} /></>;
  },
  ToggleButton: ({ userId, currentStatus, isSelf }: { userId: string; currentStatus: string; isSelf: boolean }) => {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    if (isSelf) return <span className="text-xs text-muted">أنت</span>;
    const doToggle = async () => {
      setLoading(true);
      try {
        const res = await toggleUserStatus(userId);
        if (res.ok) { toast.success("تم التحديث"); setOpen(false); }
        else toast.error("error" in res ? res.error : "تعذّر التحديث");
      } catch (error) { toast.error(error instanceof Error ? error.message : "تعذّر التحديث"); }
      finally { setLoading(false); }
    };
    const enabling = currentStatus !== "ACTIVE";
    return <><button type="button" onClick={() => setOpen(true)} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border ${enabling ? "border-success/30 text-success hover:bg-success/10" : "border-danger/30 text-danger hover:bg-danger/10"}`}>{enabling ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}{enabling ? "تفعيل" : "تعطيل"}</button><AlertDialog open={open} onOpenChange={setOpen}><AlertDialogContent><AlertDialogTitle className="text-lg font-semibold">{enabling ? "تفعيل المستخدم؟" : "تعطيل المستخدم؟"}</AlertDialogTitle><AlertDialogDescription className="text-sm text-muted">{enabling ? "سيتمكن المستخدم من تسجيل الدخول والوصول إلى المنصة مجددًا." : "لن يتمكن المستخدم من تسجيل الدخول حتى يتم تفعيله مجددًا."}</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel asChild><Button variant="outline" type="button">إلغاء</Button></AlertDialogCancel><AlertDialogAction asChild><Button type="button" variant={enabling ? "success" : "danger"} onClick={doToggle} loading={loading}>تأكيد</Button></AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>;
  },
};

function EditUserDialog({ open, onClose, user }: { open: boolean; onClose: () => void; user: { id: string; name: string; phone: string | null; role: EditableRole } }) {
  const form = useForm({ defaultValues: { name: user.name, phone: user.phone ?? "", role: user.role } });
  React.useEffect(() => { if (open) form.reset({ name: user.name, phone: user.phone ?? "", role: user.role }); }, [open, user, form]);
  const submit = form.handleSubmit(async (v) => {
    const res = await updateUser({ userId: user.id, ...v });
    if (res.ok) { toast.success("تم تحديث المستخدم"); onClose(); }
    else toast.error("error" in res ? res.error : "تعذر التحديث");
  });
  return <Dialog open={open} onOpenChange={(v) => !v && onClose()}><DialogContent><DialogHeader><DialogTitle>تعديل المستخدم</DialogTitle></DialogHeader><form onSubmit={submit} className="space-y-3"><FormField label="الاسم" required><Input {...form.register("name")} /></FormField><FormField label="الجوال"><Input {...form.register("phone")} /></FormField><FormField label="الدور" required><Select value={form.watch("role")} onValueChange={(v) => form.setValue("role", v as EditableRole)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CENTER_ADMIN">مدير مركز</SelectItem><SelectItem value="SPECIALIST">أخصائي</SelectItem><SelectItem value="DATA_ENTRY">إدخال بيانات</SelectItem><SelectItem value="VIEWER">مشاهد</SelectItem></SelectContent></Select></FormField><DialogFooter><Button type="button" variant="outline" onClick={onClose}>إلغاء</Button><Button type="submit" loading={form.formState.isSubmitting}>حفظ</Button></DialogFooter></form></DialogContent></Dialog>;
}

function CreateUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const form = useForm<UserForm>({ resolver: zodResolver(userSchema), defaultValues: { name: "", email: "", phone: "", role: "SPECIALIST", password: "" } });
  const submit = form.handleSubmit(async (v) => {
    const res = await createUser(v);
    if (res.ok) { toast.success("تم إنشاء المستخدم"); form.reset(); onClose(); }
    else toast.error("error" in res ? res.error : "تعذّر الإنشاء");
  });
  return <Dialog open={open} onOpenChange={(o) => !o && onClose()}><DialogContent><DialogHeader><DialogTitle>إضافة مستخدم جديد</DialogTitle></DialogHeader><form onSubmit={submit} className="space-y-3"><FormField label="الاسم" required error={form.formState.errors.name?.message}><Input {...form.register("name")} /></FormField><FormField label="البريد الإلكتروني" required error={form.formState.errors.email?.message}><Input type="email" {...form.register("email")} /></FormField><FormField label="الجوال"><Input {...form.register("phone")} /></FormField><FormField label="الدور" required><Select value={form.watch("role")} onValueChange={(v) => form.setValue("role", v as UserForm["role"], { shouldValidate: true })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CENTER_ADMIN">مدير مركز</SelectItem><SelectItem value="SPECIALIST">أخصائي</SelectItem><SelectItem value="DATA_ENTRY">إدخال بيانات</SelectItem><SelectItem value="VIEWER">مشاهد</SelectItem></SelectContent></Select></FormField><FormField label="كلمة المرور" hint="يجب أن تحتوي على 10 أحرف على الأقل"><Input type="password" {...form.register("password")} /></FormField><DialogFooter><Button type="button" variant="outline" onClick={onClose}>إلغاء</Button><Button type="submit" loading={form.formState.isSubmitting}>إنشاء</Button></DialogFooter></form></DialogContent></Dialog>;
}
