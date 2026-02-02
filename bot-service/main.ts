/**
 * Bot Execution Service
 *
 * Service Deno qui tourne sur EC2 (us-east-1) et exécute le bot Polymarket
 * toutes les 30 minutes via appel API au dashboard Vercel.
 *
 * Avantages:
 * - Exécution depuis US (pas de blocage géographique Polymarket)
 * - Surveillance 24/7 avec auto-restart
 * - Logs centralisés
 */

import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

// Charger les variables d'environnement
const env = await load();

const VERCEL_API_URL = Deno.env.get("VERCEL_API_URL") || env.VERCEL_API_URL || "https://bot-polymarket-fg22kl0nh-matteo-garbuglis-projects.vercel.app";
const CRON_SECRET = Deno.env.get("CRON_SECRET") || env.CRON_SECRET;
const EXECUTION_INTERVAL_MINUTES = parseInt(Deno.env.get("EXECUTION_INTERVAL_MINUTES") || "30");

// Validation
if (!CRON_SECRET) {
  console.error("❌ CRON_SECRET is required");
  Deno.exit(1);
}

console.log(`
╔═══════════════════════════════════════════════════════════╗
║              🤖 POLYMARKET BOT SERVICE                    ║
╚═══════════════════════════════════════════════════════════╝

📍 Location: EC2 us-east-1 (Virginia, USA)
🎯 Target: ${VERCEL_API_URL}
⏰ Interval: ${EXECUTION_INTERVAL_MINUTES} minutes
🚀 Starting...
`);

interface ExecutionResult {
  success: boolean;
  timestamp: string;
  error?: string;
  data?: any;
}

async function executeBotCycle(): Promise<ExecutionResult> {
  const timestamp = new Date().toISOString();

  try {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`⏰ [${timestamp}] Starting bot execution cycle`);
    console.log(`${"=".repeat(60)}\n`);

    // Appel à l'API du bot
    const response = await fetch(`${VERCEL_API_URL}/api/bot/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CRON_SECRET}`,
        "X-Bot-Source": "EC2-US-EAST-1",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    console.log("✅ Bot execution completed successfully");
    console.log("📊 Result:", JSON.stringify(data, null, 2));

    return {
      success: true,
      timestamp,
      data,
    };
  } catch (error) {
    console.error("❌ Bot execution failed:", error.message);

    return {
      success: false,
      timestamp,
      error: error.message,
    };
  }
}

// Stats tracking
let totalExecutions = 0;
let successfulExecutions = 0;
let failedExecutions = 0;
let lastSuccessTime: string | null = null;
let lastFailureTime: string | null = null;

function printStats() {
  const successRate = totalExecutions > 0
    ? ((successfulExecutions / totalExecutions) * 100).toFixed(1)
    : "0.0";

  console.log(`\n${"─".repeat(60)}`);
  console.log("📊 EXECUTION STATISTICS");
  console.log(`${"─".repeat(60)}`);
  console.log(`Total Executions:      ${totalExecutions}`);
  console.log(`✅ Successful:         ${successfulExecutions}`);
  console.log(`❌ Failed:             ${failedExecutions}`);
  console.log(`📈 Success Rate:       ${successRate}%`);
  if (lastSuccessTime) {
    console.log(`🟢 Last Success:       ${lastSuccessTime}`);
  }
  if (lastFailureTime) {
    console.log(`🔴 Last Failure:       ${lastFailureTime}`);
  }
  console.log(`${"─".repeat(60)}\n`);
}

// Main execution loop
async function runBotService() {
  console.log("🎯 Bot service is now running\n");
  console.log(`⏰ Next execution in ${EXECUTION_INTERVAL_MINUTES} minutes\n`);

  // Boucle infinie d'exécution
  while (true) {
    try {
      const result = await executeBotCycle();

      totalExecutions++;

      if (result.success) {
        successfulExecutions++;
        lastSuccessTime = result.timestamp;
      } else {
        failedExecutions++;
        lastFailureTime = result.timestamp;
      }

      printStats();

      // Attendre avant la prochaine exécution
      const waitMs = EXECUTION_INTERVAL_MINUTES * 60 * 1000;
      const nextExecutionTime = new Date(Date.now() + waitMs);

      console.log(`⏳ Waiting ${EXECUTION_INTERVAL_MINUTES} minutes until next execution...`);
      console.log(`⏰ Next execution at: ${nextExecutionTime.toLocaleString()}\n`);

      await new Promise(resolve => setTimeout(resolve, waitMs));
    } catch (error) {
      console.error("💥 Unexpected error in main loop:", error);

      // Attendre 5 minutes avant de réessayer en cas d'erreur critique
      console.log("⏳ Waiting 5 minutes before retry due to error...\n");
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    }
  }
}

// Gestion des signaux pour arrêt gracieux
Deno.addSignalListener("SIGINT", () => {
  console.log("\n\n🛑 Received SIGINT, shutting down gracefully...");
  printStats();
  console.log("👋 Bot service stopped\n");
  Deno.exit(0);
});

Deno.addSignalListener("SIGTERM", () => {
  console.log("\n\n🛑 Received SIGTERM, shutting down gracefully...");
  printStats();
  console.log("👋 Bot service stopped\n");
  Deno.exit(0);
});

// Lancer le service
runBotService();
