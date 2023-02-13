import mongoose from 'mongoose';
import dotenv from 'dotenv';
import openAiRequest from "./util/openAiRequest";
import runGoogleSearch from "./util/getGoogleResults";
import {createClient} from 'contentful-management'
import readline from 'readline';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});

const client = createClient({
	accessToken: "CFPAT-YsKDh5GaqYlngeH_iGgbZw0uzxN2Xc_rid3aq6y6AQc",
	space: process.env.REACT_APP_CONTENTFUL_SPACE_ID,
});

const db = mongoose.connection;
let links = ''
let title = 'Online Dating when you have kids kids';
let author = 'Samantha - journalist, writer, editor, and blogger';
let blogIdea = (function() {
	return {
		title: title,
		author: author,
		prompts: {
			title: `Create a unique, creative, and catchy title for this article that could be seen in a magazine. The title should accurately reflect the content of the article and should not include the year. The original title is: "${title}"`,
			links: '',
			excerpt: '',
			tags: ''
		},
		links: links
	};
})();

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', async function() {
	console.log('Connected to MongoDB');

	const generateBlogIdea = async () => {
		// Use OpenAI to generate a new blog idea
		const titleResponse = await openAiRequest(blogIdea.prompts.title, .8, 25);
		blogIdea.title = titleResponse.choices[0].text;

		const writingStyle = 'creative, funny, witty, very detailed, senior editor';
		blogIdea.links = await runGoogleSearch(title);

		// const articlePrompt = `As ${blogIdea.author}, write a blog article with a writing style of ${writingStyle}. The article should not mention the title. Instead, the focus should be on exploring the ideas and concepts related to this title: ${blogIdea.title}. If you need inspiration here are some questions you can answer in the article: ${blogIdea.links}`;
		// const articleResponse = await openAiRequest(articlePrompt, .8);
		blogIdea.article = 'hi this is it';

		const excerptPrompt = `Generate a 30 word summary of the following article. The summary should capture the main ideas and be no more than 200 characters long. ARTICLE: ${blogIdea.article}`;
		const excerptResponse = await openAiRequest(excerptPrompt, .8);
		blogIdea.excerpt = excerptResponse.choices[0].text

		const tagsPrompt = `generate 3 tags inside an array, that are one or two words based on the article ${blogIdea.title}. return the array`;
		const tagsResponse = await openAiRequest(tagsPrompt, .3);
		blogIdea.tags = tagsResponse.choices[0].text.replace(/\n\n/g, '');

		const blockquotePrompt = `generate a catchy, well thought, blockquote for the article ARTICLE: ${blogIdea.article}`;
		const blockquoteResponse = await openAiRequest(blockquotePrompt, .8);
		blogIdea.blockquote = blockquoteResponse.choices[0].text.replace(/\n\n/g, '');
	};

	const BlogIdea = mongoose.model('BlogIdea', {
		title: String,
		author: String,
		article: String,
		excerpt: String,
		tags: String,
		blockquote: String
	});


	generateBlogIdea().then(async () => {
		console.log('Blog idea generated successfully', blogIdea);
		const blogIdeaData = new BlogIdea(blogIdea);
		await blogIdeaData.save();

		console.log('Blog idea saved to database');

		rl.question('Do you want to save the blog idea to Contentful? (yes/no) ', (answer) => {
			if (answer === 'yes') {
				client.getSpace('4ij9jmh5wg5g')
					.then((space) => space.getEnvironment('master'))
					.then((environment) => environment.createEntry( {contentTypeId:  'title'},{
						fields: {
							title: {
								'en-US': blogIdea.title
							},
							body: {
								'en-US': blogIdea.article
							},
							excerpt: {
								'en-US': blogIdea.excerpt
							}
						}
					}, )
					.then((entry) => console.log(`Blog idea posted to Contentful: ${entry.sys.id}`))
					.catch(console.error));
			} else {
				console.log('Exiting without saving to Contentful');
				process.exit(0);
			}

			rl.close();
		});
	});
});

