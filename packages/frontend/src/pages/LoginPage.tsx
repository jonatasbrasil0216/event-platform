import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@event-platform/shared";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { loginRequest } from "../api/auth";
import { useAuthStore } from "../stores/auth";

const schema = loginSchema;
type FormValues = z.infer<typeof schema>;

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" }
  });

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (result) => {
      setAuth(result.token, result.user);
      toast.success("Welcome back!");
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in</h1>
        <p className="auth-copy">Access your dashboard and manage events in seconds.</p>
        <form
          className="auth-form"
          onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}
        >
          <label>
            Email
            <input type="email" placeholder="you@example.com" {...form.register("email")} />
            <span className="field-error">{form.formState.errors.email?.message ?? ""}</span>
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                {...form.register("password")}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                type="button"
              >
                {showPassword ? (
                  <svg fill="none" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3L21 21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                    <path d="M10.58 10.58C10.21 10.95 10 11.46 10 12C10 13.1 10.9 14 12 14C12.54 14 13.05 13.79 13.42 13.42" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                    <path d="M16.68 16.67C15.26 17.55 13.65 18 12 18C6.5 18 2.19 13.57 1 12C1.71 11.07 3.1 9.5 5.02 8.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                    <path d="M9.88 6.13C10.58 6.04 11.29 6 12 6C17.5 6 21.81 10.43 23 12C22.52 12.63 21.69 13.63 20.55 14.62" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  </svg>
                ) : (
                  <svg fill="none" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 12C2.19 10.43 6.5 6 12 6C17.5 6 21.81 10.43 23 12C21.81 13.57 17.5 18 12 18C6.5 18 2.19 13.57 1 12Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  </svg>
                )}
              </button>
            </div>
            <span className="field-error">{form.formState.errors.password?.message ?? ""}</span>
          </label>
          <button className="btn btn-primary" disabled={loginMutation.isPending} type="submit">
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="auth-footer">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </section>
    </main>
  );
};
