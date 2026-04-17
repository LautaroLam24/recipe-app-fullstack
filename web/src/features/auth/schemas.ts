import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Email inválido").max(320),
  password: z.string().min(1, "Ingresá tu contraseña").max(128),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "Requerido").max(100),
    lastName: z.string().trim().min(1, "Requerido").max(100),
    email: z.string().trim().email("Email inválido").max(320),
    password: z.string().min(8, "Mínimo 8 caracteres").max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterValues = z.infer<typeof registerSchema>;
