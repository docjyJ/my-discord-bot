import {writeFileSync} from 'node:fs';
import DateTime from '../date-time';
import {renderWeeklySummaryImage} from './renderer';

async function main() {
  const buf = await renderWeeklySummaryImage({
    avatarUrl: 'https://www.slate.fr/uploads/store/drupal_slate/train_1.jpg',
    // biome-ignore lint/style/noNonNullAssertion: test date
    monday: DateTime.parse('2025-10-20')!,
    goal: 8000,
    days: [5000, 8200, 7000, 9500, null, 4000, 10000],
    bestStreak: 7,
    countSucces: 29,
    countDays: 48
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
