import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "@event-platform/shared";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { signupRequest } from "../../api/auth";
import { useAuthStore } from "../../stores/auth";
import styles from "./auth.module.css";

type FormValues = z.infer<typeof signupSchema>;

export const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const form = useForm<FormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", name: "", role: "attendee" }
  });

  const signupMutation = useMutation({
    mutationFn: signupRequest,
    onSuccess: (result) => {
      setAuth(result.token, result.user);
      toast.success("Account created");
      navigate("/");
    },
    onError: (error) => toast.error(error.message)
  });

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className="eyebrow">Join in minutes</p>
        <h1>Create account</h1>
        <p className={styles.copy}>Choose your role and start hosting or discovering events.</p>
        <form className={styles.form} onSubmit={form.handleSubmit((values) => signupMutation.mutate(values))}>
          <label>
            Full name
            <input type="text" placeholder="Jane Doe" {...form.register("name")} />
            <span className="field-error">{form.formState.errors.name?.message ?? ""}</span>
          </label>
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
                placeholder="At least 8 characters"
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
          <label>
            I am joining as
            <select {...form.register("role")}>
              <option value="attendee">Attendee</option>
              <option value="organizer">Organizer</option>
            </select>
            <span className="field-error">{form.formState.errors.role?.message ?? ""}</span>
          </label>
          <button className="btn btn-primary" disabled={signupMutation.isPending} type="submit">
            {signupMutation.isPending ? "Creating..." : "Create account"}
          </button>
        </form>
        <p className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
};
