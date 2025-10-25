import {writeFileSync} from 'fs';
import {renderPresentationImage} from './renderer';

async function main() {
	const buf = await renderPresentationImage({
		username: '@tester',
		avatarUrl: 'https://www.slate.fr/uploads/store/drupal_slate/train_1.jpg',
		dateISO: '2025-10-25',
		steps: 5300,
		goal: 8000,
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

