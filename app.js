import mongoose from 'mongoose';
import dotenv from 'dotenv';
import openAiRequest from "./util/openAiRequest";
import runGoogleSearch from "./util/getGoogleResults";
dotenv.config();

mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});

const db = mongoose.connection;
let links = ''
let blogIdea = (function() {
	let title = 'Crafting ideas to do on valentines day';
	let author = 'Samantha - journalist, writer, editor, and blogger';
	let writingStyle = 'creative, funny, witty, very detailed, senior editor'
	return {
		title: title,
		author: author,
		prompts: {
			title: `Create a unique, creative, and catchy title for this article that could be seen in a magazine. The title should accurately reflect the content of the article and should not include the year. The original title is: "${title}"`,
			links: '',
		},
		links: links
	};
})();

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', async function() {
	console.log('Connected to MongoDB');
	// Use OpenAI to generate a new blog idea
	await openAiRequest(blogIdea.prompts.title, .8, 25).then((data) => {
		console.log('34', data);
		blogIdea.title = data.choices[0].text;
	});

	blogIdea.links = await runGoogleSearch(blogIdea.title).then(data => data);
	links = blogIdea.links;
	blogIdea.prompts.article = `As ${blogIdea.author}, write a blog article with a writing style of ${blogIdea.writingStyle}. The article should  not mention the title. Instead, the focus should be on exploring the ideas and concepts related to this title: ${blogIdea.title}.  If you need inspiration here are some questions you can answer in the article: ${blogIdea.links}`;

	await openAiRequest(blogIdea.prompts.article, .8).then((data) => {
		console.log('43', data);
		blogIdea.article = data.choices[0].text;
	});

	console.log(blogIdea)
});
