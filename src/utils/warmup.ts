import { FastifyInstance } from "fastify";

export const warmup = async (app: FastifyInstance) => {
  const mccs = ["5411", "5812", "5912", "7801", "9999"];
  const merchants = ["MERC-001", "MERC-016", "MERC-999"];

  const getPayload = (i: number) => ({
    id: `w-${i}`,
    transaction: {
      amount: (i % 1000) + 1,
      installments: (i % 12) + 1,
      requested_at: `2026-03-11T${String(i % 24).padStart(2, "0")}:00:00Z`,
    },
    customer: {
      avg_amount: 100.0,
      tx_count_24h: i % 10,
      known_merchants: i % 2 === 0 ? ["MERC-016"] : [],
    },
    merchant: {
      id: merchants[i % merchants.length],
      mcc: mccs[i % mccs.length],
      avg_amount: 50.0,
    },
    terminal: {
      is_online: i % 3 === 0,
      card_present: i % 2 === 0,
      km_from_home: i % 100,
    },
    last_transaction:
      i % 5 === 0
        ? null
        : {
            timestamp: "2026-03-11T10:00:00Z",
            km_from_current: 5.0,
          },
  });

  for (let i = 0; i < 5000; i++) {
    await app.inject({
      method: "POST",
      url: "/fraud-score",
      payload: getPayload(i),
    });
  }
};
