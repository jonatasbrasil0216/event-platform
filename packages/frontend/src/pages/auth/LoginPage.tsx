import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@event-platform/shared";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { loginRequest } from "../../api/auth";
import { useAuthStore } from "../../stores/auth";
import styles from "./auth.module.css";

type FormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const form = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (result) => {
      setAuth(result.token, result.user);
      toast.success("Welcome back!");
      navigate("/");
    },
    onError: (error) => toast.error(error.message)
  });

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in</h1>
        <p className={styles.copy}>Access your dashboard and manage events in seconds.</p>
        <form className={styles.form} onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}>
          <label>
            Email
            <input type="email" placeholder="you@example.com" {...form.register("email")} />
            <span className="field-error">{form.formState.errors.email?.message ?? ""}</span>
          </label>
          <label>
            Password
            <div className={styles.passwordField}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                {...form.register("password")}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className={styles.passwordToggle}
                onClick={() => setShowPassword((prev) => !prev)}
                type="button"
              >
                {showPassword ? <EyeOff size={18} strokeWidth={1.9} /> : <Eye size={18} strokeWidth={1.9} />}
              </button>
            </div>
            <span className="field-error">{form.formState.errors.password?.message ?? ""}</span>
          </label>
          <button className="btn btn-primary" disabled={loginMutation.isPending} type="submit">
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className={styles.footer}>
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </section>
    </main>
  );
};
