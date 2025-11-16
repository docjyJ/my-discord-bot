import {writeFileSync} from 'node:fs';
import DateTime from '../date-time';
import {renderMonthlySummaryImage} from './renderer';

async function main() {
  // Mois de mars 2024 avec 31 jours, commence un vendredi (2024-03-01)
  // Sans objectif défini
  const days: (number | null)[] = [
    8500,
    9200,
    7000, // Semaine 1 partielle (1-3 : ven-dim)
    10500,
    8200,
    9000,
    11000,
    7500,
    8800,
    9500, // Semaine 2 (4-10)
    7200,
    8000,
    9200,
    10500,
    8200,
    9000,
    8500, // Semaine 3 (11-17)
    8800,
    9500,
    null,
    10000,
    8500,
    9200,
    8000, // Semaine 4 (18-24) avec un jour null
    9500,
    8200,
    9000,
    11500,
    7500,
    8800,
    6500 // Semaine 5 (25-31)
  ];

  const buf = await renderMonthlySummaryImage({
    // biome-ignore lint/style/noNonNullAssertion: test date
    date: DateTime.parse('2024-03-01')!,
    days,
    bestStreak: null,
    countEntries: 30,
    countSuccesses: null,
    avatarUrl: 'https://www.slate.fr/uploads/store/drupal_slate/train_1.jpg',
    goal: null
  });
  writeFileSync('test-monthly-no-goal.png', buf);
}

main()
  .then(() => {
    console.log('Monthly image (no goal) written to test-monthly-no-goal.png');
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
