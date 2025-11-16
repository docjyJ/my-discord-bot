import {writeFileSync} from 'node:fs';
import DateTime from '../date-time';
import {renderMonthlySummaryImage} from './renderer';

async function main() {
  // Mois de février 2024 avec 29 jours (année bissextile), commence un jeudi (2024-02-01)
  const days: (number | null)[] = [
    8500,
    9200,
    7000,
    10500, // Semaine 1 partielle (1-4 : jeu-dim)
    8200,
    9000,
    11000,
    7500,
    8800,
    9500,
    7200, // Semaine 2 (5-11)
    8000,
    9200,
    10500,
    8200,
    9000,
    8500,
    8800, // Semaine 3 (12-18)
    9500,
    7000,
    10000,
    8500,
    9200,
    8000,
    9500, // Semaine 4 (19-25)
    8200,
    9000,
    11500,
    7500 // Semaine 5 partielle (26-29)
  ];

  const buf = await renderMonthlySummaryImage({
    // biome-ignore lint/style/noNonNullAssertion: test date
    date: DateTime.parse('2024-02-01')!,
    days,
    bestStreak: 12,
    countEntries: 29,
    countSuccesses: 26,
    avatarUrl: 'https://www.slate.fr/uploads/store/drupal_slate/train_1.jpg',
    goal: 8000
  });
  writeFileSync('test-monthly-feb.png', buf);
}

main()
  .then(() => {
    console.log('Monthly image (February) written to test-monthly-feb.png');
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
