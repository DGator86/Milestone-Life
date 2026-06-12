import { z } from "zod";

const RecurrenceUnitSchema = z.enum(["day", "week", "month", "year"]);

const goalRecurrenceFields = {
  is_recurring: z.boolean(),
  recurrence_interval: z.coerce.number().int().min(1).max(365).nullable(),
  recurrence_unit: RecurrenceUnitSchema.nullable(),
  recurrence_end_date: z.string().nullable(),
};

const goalRecurrenceRefine = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((data, ctx) => {
    const value = data as {
      is_recurring: boolean;
      recurrence_interval: number | null;
      recurrence_unit: string | null;
    };
    if (!value.is_recurring) return;
    if (!value.recurrence_interval) {
      ctx.addIssue({
        code: "custom",
        message: "Recurrence interval is required",
        path: ["recurrence_interval"],
      });
    }
    if (!value.recurrence_unit) {
      ctx.addIssue({
        code: "custom",
        message: "Recurrence unit is required",
        path: ["recurrence_unit"],
      });
    }
  });

export const CreateGoalSchema = goalRecurrenceRefine(
  z.object({
    title: z.string().min(1, "Title is required").max(120, "Title too long"),
    group_id: z.string().min(1, "Group is required"),
    goal_type: z.enum(["concrete", "touches", "deadline", "maintenance"]),
    importance: z.enum(["normal", "important", "critical"]),
    due_date: z.string().nullable(),
    ...goalRecurrenceFields,
  })
);

export const UpdateGoalSchema = goalRecurrenceRefine(
  z.object({
    title: z.string().min(1, "Title is required").max(120, "Title too long"),
    group_id: z.string().min(1, "Group is required"),
    goal_type: z.enum(["concrete", "touches", "deadline", "maintenance"]),
    importance: z.enum(["normal", "important", "critical"]),
    due_date: z.string().nullable(),
    ...goalRecurrenceFields,
  })
);

export const CreateGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(50, "Name too long"),
  color: z.string().min(1, "Color is required"),
});

export const CreateContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().max(200).pipe(z.email("Invalid email")).nullable(),
  phone: z.string().max(30).nullable(),
  company: z.string().max(100).nullable(),
  role: z.string().max(100).nullable(),
  list_id: z.string().nullable(),
  touch_frequency_days: z.number().int().positive().nullable(),
  notes: z.string().max(2000).nullable(),
});

export const LogTouchSchema = z.object({
  contact_id: z.string().min(1, "Contact is required"),
  type: z.enum(["call", "email", "meeting", "note"]),
  notes: z.string().max(2000).nullable(),
  touched_at: z.string().nullable(),
});
