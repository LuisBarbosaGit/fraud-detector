import { z } from "zod";

export const fraudDetectionSchema = z.object({
  id: z.string(),
  transaction: z.object({
    amount: z.number().nonnegative(),
    installments: z.number().int().positive(),
    requested_at: z.iso.datetime(),
  }),
  customer: z.object({
    avg_amount: z.number().nonnegative(),
    tx_count_24h: z.number().int().nonnegative(),
    known_merchants: z.array(z.string()),
  }),
  merchant: z.object({
    id: z.string(),
    mcc: z.string(),
    avg_amount: z.number().nonnegative(),
  }),
  terminal: z.object({
    is_online: z.boolean(),
    card_present: z.boolean(),
    km_from_home: z.number().nonnegative(),
  }),
  last_transaction: z
    .object({
      timestamp: z.iso.datetime(),
      km_from_current: z.number().nonnegative(),
    })
    .nullable(),
});

// A tipagem é inferida automaticamente, evitando duplicação de código
export type FraudDetectionPayload = z.infer<typeof fraudDetectionSchema>;
