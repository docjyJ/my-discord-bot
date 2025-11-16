import {writeFileSync} from 'node:fs';
import DateTime from '../date-time';
import {renderWeeklySummaryImage} from './renderer';

async function main() {
  const buf = await renderWeeklySummaryImage({
    // biome-ignore lint/style/noNonNullAssertion: test date
    date: DateTime.parse('2025-10-20')!,
    days: [5000, 8200, 7000, 9500, null, 4000, 10000],
    bestStreak: 7,
    countEntries: 40,
    countSuccesses: 29,
    avatarUrl: 'https://www.slate.fr/uploads/store/drupal_slate/train_1.jpg',
    goal: 8000
  });
  writeFileSync('test-weekly.png', buf);
}

main()
  .then(() => {
    console.log('Weekly image written to test-weekly.png');
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
