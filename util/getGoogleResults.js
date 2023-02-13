import puppeteer from 'puppeteer';
import {Configuration, OpenAIApi} from "openai";

const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);
export default async function runGoogleSearch(searchTerm) {
	const browser = await puppeteer.launch({
		headless: false
	});
	const page = await browser.newPage();
	await page.goto(`https://google.com/search?q=${searchTerm}`);
	console.log('starting google search')
	await page.waitForSelector('.iDjcJe', { timeout: 60000 });
	const topics = await page.evaluate(async () => {
		const links = await Array.from(document.querySelectorAll('#search .iDjcJe span'));
		return links.map((link,index) => ({
			question: link.textContent
		}));
	});

	await browser.close();
	const firstThreeQuestions = await topics.slice(0, 3).map(topic => topic.question);
	const joinedQuestions = await firstThreeQuestions.join(' ');

	console.log('search complete returning questions', topics)
	return joinedQuestions
}

