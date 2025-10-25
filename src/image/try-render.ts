import { writeFileSync } from 'fs';
import { renderPresentationImage } from './renderer';

async function main() {
  const buf = await renderPresentationImage({
    username: '@tester',
    avatarUrl: undefined,
    dateISO: '2025-10-25',
    steps: 5300,
    goal: 8000,
  });
  writeFileSync('test-render.png', buf);
  console.log('Wrote test-render.png');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

