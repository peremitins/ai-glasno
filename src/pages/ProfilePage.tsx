import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  useGetProfileQuery,
  useUpdateProfileMutation,
} from "@/entities/user/api/authApi";
import { getApiErrorMessage } from "@/shared/api/baseApi";

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Укажите имя не короче двух символов"),
});

type ProfileForm = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const [isSaved, setIsSaved] = useState(false);
  const { data: user, error, isError, isLoading } = useGetProfileQuery();
  const [updateProfile, updateState] = useUpdateProfileMutation();
  const form = useForm<ProfileForm>({
    defaultValues: { displayName: "" },
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (user) {
      form.reset({ displayName: user.displayName });
    }
  }, [form, user]);

  async function submitProfile(values: ProfileForm) {
    try {
      await updateProfile({ displayName: values.displayName.trim() }).unwrap();
      setIsSaved(true);
    } catch (requestError) {
      setIsSaved(false);
      form.setError("root", { message: getApiErrorMessage(requestError) });
    }
  }

  if (isLoading) {
    return <p role="status">Загрузка профиля…</p>;
  }

  if (isError) {
    return <p role="alert">{getApiErrorMessage(error)}</p>;
  }

  if (!user) {
    return <p role="alert">Данные профиля отсутствуют.</p>;
  }

  return (
    <section className="max-w-xl space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Аккаунт</p>
        <h1 className="text-4xl font-semibold tracking-tight">Профиль</h1>
        <p className="text-muted-foreground">
          Настройте данные, которые будут использоваться в сессиях.
        </p>
      </div>
      <form
        className="space-y-4 rounded-lg border border-border bg-card p-6"
        noValidate
        onSubmit={form.handleSubmit(submitProfile)}
      >
        <label className="grid gap-2" htmlFor="display-name">
          Имя
          <input
            {...form.register("displayName", {
              onChange: () => setIsSaved(false),
            })}
            autoComplete="name"
            className="rounded-md border border-input bg-background px-3 py-2"
            id="display-name"
          />
        </label>
        {form.formState.errors.displayName && (
          <p className="text-sm text-destructive">
            {form.formState.errors.displayName.message}
          </p>
        )}
        <div className="grid gap-2">
          <span className="text-sm font-medium">E-mail</span>
          <p className="rounded-md border border-border bg-muted px-3 py-2 text-muted-foreground">
            {user.email}
          </p>
        </div>
        {form.formState.errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}
        {isSaved && (
          <p role="status" className="text-sm text-muted-foreground">
            Профиль сохранён.
          </p>
        )}
        <button
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          disabled={updateState.isLoading}
        >
          Сохранить
        </button>
      </form>
    </section>
  );
}
