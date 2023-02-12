const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log('Connected to MongoDB');

	// Define a schema
	const blogIdeaSchema = new mongoose.Schema({
		title: String
	});

	// Create a model
	const BlogIdea = mongoose.model('BlogIdea', blogIdeaSchema);

	// Check if there are any blog ideas in the collection
	BlogIdea.countDocuments({}, function (err, count) {
		if (err) return console.error(err);
		if (count === 0) {
			// Insert an array of blog ideas
			const blogIdeas = [
				{ title: 'The science of love and attraction' },
				{ title: 'Tips for a successful first date' },
				{ title: 'Understanding different love languages' },
				{ title: 'How to navigate a long-distance relationship' },
				{ title: 'The impact of technology on dating and relationships' },
				{ title: 'Understanding and overcoming relationship anxiety' },
				{ title: 'How to deal with heartbreak and moving on' },
				{ title: 'The importance of communication in relationships' },
				{ title: 'The different stages of a relationship and what to expect at each stage' }
			];
			BlogIdea.insertMany(blogIdeas, function (err) {
				if (err) return console.error(err);
				console.log('Blog ideas inserted');
			});
		} else {
			// Return a single random blog idea
			BlogIdea.aggregate([{ $sample: { size: 1 } }], function (err, blogIdea) {
				if (err) return console.error(err);
				console.log('Random blog idea: ', blogIdea[0].title);
			});
		}
	});
});

