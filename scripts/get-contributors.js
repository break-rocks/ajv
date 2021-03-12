// Credit for the script goes to svelte:
// https://github.com/sveltejs/svelte/blob/ce3a5791258ec6ecf8c1ea022cb871afe805a45c/site/scripts/get-contributors.js

require('dotenv/config');
const fs = require('fs');
const fetch = require('node-fetch');
const Jimp = require('jimp');

process.chdir(__dirname);

const base = `https://api.github.com/repos/ajv-validator/ajv/contributors`;
const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;

const SIZE = 64;

async function main() {
	const contributors = [];
	let page = 1;

	while (true) {
		const res = await fetch(`${base}?client_id=${GITHUB_CLIENT_ID}&client_secret=${GITHUB_CLIENT_SECRET}&per_page=100&page=${page++}`);
		const list = await res.json();

		if (list.length === 0) break;

		contributors.push(...list);
	}

	const bots = ['dependabot-preview[bot]', 'greenkeeper[bot]', 'greenkeeperio-bot']

	const authors = contributors
		.filter(a => !bots.includes(a.login))
		.sort((a, b) => b.contributions - a.contributions);

	const sprite = new Jimp(SIZE * authors.length, SIZE);

	for (let i = 0; i < authors.length; i += 1) {
		const author = authors[i];
		console.log(`${i + 1} / ${authors.length}: ${author.login}`);

		const image_data = await fetch(author.avatar_url);
		const buffer = await image_data.arrayBuffer();

		const image = await Jimp.read(buffer);
		image.resize(SIZE, SIZE);

		sprite.composite(image, i * SIZE, 0);
	}

	await sprite.quality(80).write(`../docs/contributors/contributors.jpg`);
	// TODO: Optimizing the contributors.jpg image should probably get automated as well
	console.log('remember to additionally optimize the resulting contributors.jpg image file via e.g. https://squoosh.app ');

	const str = `[\n\t${authors.map(a => `'${a.login}'`).join(',\n\t')}\n]`;

	fs.writeFileSync(`../docs/contributors/_contributors.js`, `export default ${str};`);
}

main();
