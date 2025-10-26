import {writeFileSync} from 'fs';
import {renderPresentationImage} from './renderer';
import DateTime from "../date-time";

async function main() {
	const buf = await renderPresentationImage({
		username: '@tester',
		avatarUrl: 'https://www.slate.fr/uploads/store/drupal_slate/train_1.jpg',
		date: DateTime.parse('2025-10-25')!,
		steps: 5300,
		goal: 8000,
		streak: 3,
	});
	writeFileSync('test-render.png', buf);
}

main()
	.then(() => {
		console.log('Image written to test-render.png');
		process.exit(0);
	})
	.catch(e => {
		console.error(e);
		process.exit(1);
	});
