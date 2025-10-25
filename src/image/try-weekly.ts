import {writeFileSync} from 'fs';
import {renderWeeklySummaryImage} from './renderer';

async function main() {
	const buf = await renderWeeklySummaryImage({
		avatarUrl: 'https://www.slate.fr/uploads/store/drupal_slate/train_1.jpg',
		mondayISO: '2025-10-20',
		goal: 8000,
		days: [5000, 8200, 7000, 9500, null, 4000, 10000],
		streak: 1,
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
