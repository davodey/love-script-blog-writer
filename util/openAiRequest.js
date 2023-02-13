import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function openAiRequest (prompt, temp = .8, tokens = 1000) {
	const completion = await openai.createCompletion({
		model: 'text-davinci-003',
		prompt: prompt,
		temperature: temp,
		max_tokens: tokens
	});
	return await completion.data;
}

