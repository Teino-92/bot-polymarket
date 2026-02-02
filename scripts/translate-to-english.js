#!/usr/bin/env node

/**
 * Script to translate all French text to English in the codebase
 * Run with: node scripts/translate-to-english.js
 */

const fs = require('fs');
const path = require('path');

// Translation dictionary: French -> English
const translations = {
  // Common UI terms
  "Suivi en temps réel des WebSocket et status du bot": "Real-time WebSocket tracking and bot status",
  "Vue d'ensemble des stats (PnL, positions, volume, win rate)": "Stats overview (PnL, positions, volume, win rate)",
  "Évolution du profit & loss sur 7 jours": "Profit & loss evolution over 7 days",
  "Positions Actives": "Active Positions",
  "Historique des Trades": "Trade History",
  "Meilleures opportunités de trading détectées": "Best trading opportunities detected",
  "Personnaliser le Dashboard": "Customize Dashboard",
  "Affiche ou masque les sections selon tes préférences": "Show or hide sections according to your preferences",
  "Réinitialiser": "Reset",
  "Terminé": "Done",
  "Personnaliser le dashboard": "Customize dashboard",

  // Manual Controls
  "Contrôles Manuels": "Manual Controls",
  "Actions rapides": "Quick actions",
  "Scan en cours...": "Scanning...",
  "Scanner maintenant": "Scan now",
  "Changement...": "Changing...",
  "Reprendre le bot": "Resume bot",
  "Mettre en pause": "Pause bot",
  "Bot en pause - Aucune nouvelle position ne sera ouverte": "Bot paused - No new positions will be opened",
  "Réglages avancés": "Advanced settings",
  "Stratégie HOLD": "HOLD Strategy",
  "HVS Minimum (€)": "Minimum HVS (€)",
  "Score minimum pour ouvrir une position HOLD": "Minimum score to open a HOLD position",
  "Stratégie FLIP": "FLIP Strategy",
  "FlipEV Minimum (€)": "Minimum FlipEV (€)",
  "EV minimum pour ouvrir une position FLIP": "Minimum EV to open a FLIP position",
  "Gestion du Risque": "Risk Management",
  "Perte maximale avant sortie automatique": "Maximum loss before automatic exit",
  "Gain cible pour sortie automatique (FLIP uniquement)": "Target gain for automatic exit (FLIP only)",
  "Taille des Positions": "Position Sizing",
  "Nombre maximum de positions simultanées": "Maximum number of simultaneous positions",
  "Taille Max par Position (€)": "Max Size per Position (€)",
  "Capital maximum par trade": "Maximum capital per trade",
  "Sauvegarde...": "Saving...",
  "Sauvegarder les modifications": "Save changes",

  // Performance Charts
  "Gains": "Wins",
  "Pertes": "Losses",
  "PnL Cumulatif (€)": "Cumulative PnL (€)",
  "PnL par trade (€)": "PnL per trade (€)",

  // Live Monitoring
  "Prochain Cron": "Next Cron",
  "Dernière mise à jour": "Last update",
  "il y a": "ago",

  // Time units
  "jour": "day",
  "jours": "days",
  "heure": "hour",
  "heures": "hours",
  "minute": "minute",
  "minutes": "minutes",
  "seconde": "second",
  "secondes": "seconds",

  // Calculators
  "Plus conservateur": "More conservative",
  "Position size en EUR": "Position size in EUR",
  "Calcule la taille de position optimale pour maximiser la croissance long terme de ton capital.": "Calculates the optimal position size to maximize long-term capital growth.",
  "Recommandation: Utilise Half-Kelly (50%) pour réduire la volatilité": "Recommendation: Use Half-Kelly (50%) to reduce volatility",
  "Pourcentage de trades gagnants historiques": "Historical winning trades percentage",
  "Gain Moyen (€)": "Average Win (€)",
  "Gain moyen par trade gagnant": "Average profit per winning trade",
  "Perte Moyenne (€)": "Average Loss (€)",
  "Perte moyenne par trade perdant (valeur positive)": "Average loss per losing trade (positive value)",
  "Ton capital de trading total": "Your total trading capital",
  "Résultats": "Results",
  "Recommandé": "Recommended",

  // Risk Reward Calculator
  "R:R >= 2:1 est considéré bon": "R:R >= 2:1 is considered good",
  "Calcule le ratio risque/récompense de ton trade. Un bon trade a généralement un R:R ≥ 2:1.": "Calculates the risk/reward ratio of your trade. A good trade typically has R:R ≥ 2:1.",
  "Prix d'entrée prévu (0-1)": "Expected entry price (0-1)",
  "Prix où tu couperas ta perte": "Price where you'll cut your loss",
  "Prix où tu prendras ton profit": "Price where you'll take your profit",
  "Taille de la position en euros": "Position size in euros",
  "Risque Maximum": "Maximum Risk",
  "Récompense Potentielle": "Potential Reward",
  "Excellent ratio risque/récompense": "Excellent risk/reward ratio",
  "Ratio faible. Vise au moins 1:2": "Low ratio. Aim for at least 1:2",
  "Win Rate Nécessaire (Break-even)": "Required Win Rate (Break-even)",
  "Tu dois gagner au moins": "You must win at least",
  "du temps pour être profitable": "of the time to be profitable",
  "Guide R:R": "R:R Guide",
  "Visualisation": "Visualization",

  // Position Sizing Calculator
  "Règle d'or: Ne jamais risquer plus de 1-2% de ton capital par trade": "Golden rule: Never risk more than 1-2% of your capital per trade",
  "de ton capital que tu es prêt à perdre sur ce trade": "of your capital you're willing to lose on this trade",
  "Prix du stop-loss": "Stop-loss price",
  "Taille de Position Recommandée": "Recommended Position Size",
  "Montant à Risquer": "Amount to Risk",
  "Risque par Unité": "Risk per Unit",
  "Position Size (Shares)": "Position Size (Shares)",
  "Capital Requis": "Required Capital",
  "de ton bankroll": "of your bankroll",
  "Niveau de Risque": "Risk Level",
  "Conservateur - Excellent pour la préservation du capital": "Conservative - Excellent for capital preservation",
  "Modéré - Attention aux séries de pertes": "Moderate - Watch out for losing streaks",
  "Agressif - Risque élevé de grosse perte": "Aggressive - High risk of large loss",
  "Configuration Invalide": "Invalid Configuration",

  // Flip Breakeven Calculator
  "Pour être breakeven après flip": "To break even after flip",
  "Côté Initial Acheté": "Initial Side Bought",
  "Le côté que tu as acheté initialement": "The side you bought initially",
  "Prix d'Achat Initial": "Initial Purchase Price",
  "Prix auquel tu as acheté": "Price at which you bought",
  "Montant investi initialement": "Amount initially invested",
  "Profit Cible (€)": "Target Profit (€)",
  "Profit que tu veux réaliser sur le flip": "Profit you want to make on the flip",
  "Scénario": "Scenario",
  "Coût Total Initial": "Initial Total Cost",
  "Prix Breakeven": "Breakeven Price",
  "Prix pour": "Price for",
  "de profit": "profit",
  "Zone de Trading": "Trading Zone",

  // Comments (only for locale formatting)
  "'fr-FR'": "'en-US'",
};

// Files to translate (user-facing components only)
const filesToTranslate = [
  'components/DashboardCustomizer.tsx',
  'components/ManualControls.tsx',
  'components/LiveMonitoring.tsx',
  'components/PerformanceCharts.tsx',
  'components/Calculators/KellyCriterionCalculator.tsx',
  'components/Calculators/RiskRewardCalculator.tsx',
  'components/Calculators/PositionSizingCalculator.tsx',
  'components/Calculators/FlipBreakevenCalculator.tsx',
];

function translateFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Apply all translations
  for (const [french, english] of Object.entries(translations)) {
    const originalContent = content;
    // Escape special regex characters in the French text
    const escapedFrench = french.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedFrench, 'g');
    content = content.replace(regex, english);

    if (content !== originalContent) {
      modified = true;
      const count = (originalContent.match(regex) || []).length;
      console.log(`  ✓ Replaced "${french}" -> "${english}" (${count}x)`);
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Translated: ${filePath}\n`);
    return true;
  } else {
    console.log(`⏭️  No changes: ${filePath}\n`);
    return false;
  }
}

// Main execution
console.log('🌍 Starting translation from French to English...\n');

let totalFiles = 0;
let translatedFiles = 0;

for (const file of filesToTranslate) {
  totalFiles++;
  if (translateFile(file)) {
    translatedFiles++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Total files processed: ${totalFiles}`);
console.log(`   Files translated: ${translatedFiles}`);
console.log(`   Files unchanged: ${totalFiles - translatedFiles}`);
console.log(`\n✨ Translation complete!`);
