"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

const schema = z.object({
  pincode: z.string().regex(/^[1-9]\d{5}$/, "Enter a 6-digit PIN code"),
  marketingEmail: z.boolean(),
});

type Values = z.infer<typeof schema>;

/** Demonstrates the Form bindings: label, description, inline error and an unticked opt-in. */
export function FormDemo() {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { pincode: "", marketingEmail: false },
  });

  return (
    <Form {...form}>
      <form
        noValidate
        className="grid max-w-sm gap-5"
        onSubmit={form.handleSubmit((values) =>
          toast({ title: "Checked", description: `Delivery available to ${values.pincode}.` }),
        )}
      >
        <FormField
          control={form.control}
          name="pincode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PIN code</FormLabel>
              <FormControl>
                <Input inputMode="numeric" autoComplete="postal-code" maxLength={6} {...field} />
              </FormControl>
              <FormDescription>
                We check delivery dates and cash on delivery for this PIN.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="marketingEmail"
          render={({ field }) => (
            <FormItem className="flex items-start gap-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="mt-0.5"
                />
              </FormControl>
              <div className="grid gap-1">
                <FormLabel>Email me about new weaves</FormLabel>
                <FormDescription>
                  Optional. You can withdraw any time from your account.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-fit">
          Check delivery
        </Button>
      </form>
    </Form>
  );
}
