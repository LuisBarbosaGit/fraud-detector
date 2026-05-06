import { MCC_RISK, constantsToNormalize } from "../constants/index.js";
import { FraudDetectionPayload } from "../schema.js";

const INV_60000 = 1 / 60000;
const INV_23 = 1 / 23;
const INV_6 = 1 / 6;
const clamp = (value: number) => Math.min(1, Math.max(0, value));

const {
  max_amount,
  max_installments,
  amount_vs_avg_ratio,
  max_minutes,
  max_km,
  max_tx_count_24h,
  max_merchant_avg_amount,
} = constantsToNormalize;

const vector = new Float32Array(14);

export const convertToVector = (data: FraudDetectionPayload): Float32Array => {
  const { transaction, customer, merchant, terminal, last_transaction } = data;

  // [0] e [1]
  const amt = transaction.amount;
  vector[0] = clamp(amt / max_amount);

  vector[1] = clamp(transaction.installments / max_installments);

  // [2] amount_vs_avg
  const avg = customer.avg_amount || 1;
  vector[2] = clamp(amt / avg / amount_vs_avg_ratio);

  // --- OTIMIZAÇÃO DE DATA ---
  const reqStr = transaction.requested_at; // "2026-03-11T20:23:35Z"

  const hh = parseInt(reqStr.substring(11, 13), 10);
  vector[3] = hh * INV_23;

  const reqDate = new Date(reqStr);
  const jsDay = reqDate.getUTCDay();
  vector[4] = (jsDay === 0 ? 6 : jsDay - 1) * INV_6;

  // [5] e [6] - Diferença de tempo usando timestamps numéricos
  if (last_transaction === null) {
    vector[5] = -1;
    vector[6] = -1;
  } else {
    const reqMs = reqDate.getTime();
    const lastMs = Date.parse(last_transaction.timestamp);

    vector[5] = clamp(((reqMs - lastMs) * INV_60000) / max_minutes);

    vector[6] = clamp(last_transaction.km_from_current / max_km);
  }

  // [7] a [10]
  vector[7] = clamp(terminal.km_from_home / max_km);

  vector[8] = clamp(customer.tx_count_24h / max_tx_count_24h);

  vector[9] = terminal.is_online ? 1 : 0;
  vector[10] = terminal.card_present ? 1 : 0;

  // [11] unknown_merchant (Includes em arrays pequenos é ok, mas Set é rei)
  vector[11] = customer.known_merchants.includes(merchant.id) ? 0 : 1;

  // [12] mcc_risk (Lookup O(1))
  vector[12] = (MCC_RISK as any)[merchant.mcc] ?? 0.5;

  // [13] merchant_avg_amount
  vector[13] = clamp(merchant.avg_amount / max_merchant_avg_amount);

  return vector;
};
