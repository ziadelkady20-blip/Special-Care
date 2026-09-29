"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, FormField } from "@/components/ui";
import { changeOwnPassword } from "@/app/actions";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({
  currentPassword: z.string().min(1, "أدخل كلمة المرور الحالية"),
  newPassword: z.string().min(10, "10 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "أعد كتابة كلمة المرور"),
});

type FormValues = z.infer<typeof schema>;

export function ChangePasswordButton() {
  const [open, setOpen] = React.useState(false);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });
  const [show, setShow] = React.useState(false);

  const submit = form.handleSubmit(async (values) => {
    const result = await changeOwnPassword(values);
    if (result.ok) {
      toast.success("تم تغيير كلمة المرور بنجاح");
      form.reset();
      setOpen(false);
    } else {
      toast.error(result.error ?? "تعذر تغيير كلمة المرور");
    }
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>تغيير كلمة المرور</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>تغيير كلمة المرور</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <FormField label="كلمة المرور الحالية" required error={form.formState.errors.currentPassword?.message}>
              <Input type={show ? "text" : "password"} {...form.register("currentPassword")} />
            </FormField>
            <FormField label="كلمة المرور الجديدة" required error={form.formState.errors.newPassword?.message} hint="10 أحرف على الأقل">
              <div className="relative"><Input type={show ? "text" : "password"} {...form.register("newPassword")} /><button type="button" onClick={() => setShow((v) => !v)} className="absolute end-2 top-1/2 -translate-y-1/2 text-muted" aria-label={show ? "إخفاء" : "إظهار"}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
            </FormField>
            <FormField label="تأكيد كلمة المرور" required error={form.formState.errors.confirmPassword?.message}>
              <Input type={show ? "text" : "password"} {...form.register("confirmPassword")} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button type="submit" loading={form.formState.isSubmitting}>حفظ</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
