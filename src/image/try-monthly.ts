import {writeFileSync} from 'node:fs';
import DateTime from '../date-time';
import {renderMonthlySummaryImage} from './renderer';

async function main() {
  // Mois de janvier 2024 avec 31 jours, commence un lundi (2024-01-01)
  const days: (number | null)[] = [
    8500,
    9200,
    7000,
    10500,
    8200,
    9000,
    11000, // Semaine 1 (1-7)
    7500,
    8800,
    9500,
    7200,
    8000,
    9200,
    10500, // Semaine 2 (8-14)
    8200,
    9000,
    8500,
    8800,
    9500,
    7000,
    10000, // Semaine 3 (15-21)
    8500,
    9200,
    8000,
    9500,
    8200,
    9000,
    11500, // Semaine 4 (22-28)
    7500,
    8800,
    6500 // Semaine 5 (29-31)
  ];

  const buf = await renderMonthlySummaryImage({
    // biome-ignore lint/style/noNonNullAssertion: test date
    date: DateTime.parse('2024-01-01')!,
    days,
    bestStreak: 15,
    countEntries: 31,
    countSuccesses: 27,
    avatarUrl: 'https://www.slate.fr/uploads/store/drupal_slate/train_1.jpg',
    goal: 8000
  });
  writeFileSync('test-monthly.png', buf);
}

main()
  .then(() => {
    console.log('Monthly image written to test-monthly.png');
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
