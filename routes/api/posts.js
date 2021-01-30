const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth.js');

const Profile = require('./models/Profile.js');
const User = require('./models/User.js');
const Post = require('./models/Post.js');

// @route    POST /api/posts
// @desc     Create a post
// @access   Private
router.post(
	'/',
	[auth, [check('text', 'Text is required').not().isEmpty()]],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const user = await User.findById(req.user.id).select('-password');

			const post = new Post({
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id
			});

			await post.save();
			res.status(201).json(post);
		} catch (error) {
			console.error(error);
			res.status(500).send('Server Error');
		}
	}
);

// @route    GET /api/posts
// @desc     Get all posts
// @access   Private
router.get('/', auth, async (req, res) => {
	try {
		const posts = await Post.find({}).sort({ date: -1 });
		res.json(posts);
	} catch (error) {
		console.error(error);
		res.status(500).send('Server Error');
	}
});

// @route    GET /api/posts/:post_id
// @desc     Get a post by ID
// @access   Private
router.get('/:post_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);

		if (!post) {
			return res.status(404).json({ msg: 'Post not found' });
		}

		res.json(post);
	} catch (error) {
		if (error.kind) {
			return res.status(404).json({ msg: 'Post not found' });
		}
		console.error(error);
		res.status(500).send('Server Error');
	}
});

// @route    DELETE /api/posts/:post_id
// @desc     Delete a post by ID
// @access   Private
router.delete('/:post_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);

		if (!post) {
			return res.status(404).json({ msg: 'Post not found' });
		}

		// Check if the authenticated user owns the post
		if (post.user.toString() !== req.user.id) {
			return res
				.status(401)
				.json({ msg: 'Access denied: the user does not own the post' });
		}

		await post.remove();

		res.json({ msg: 'The post has been removed' });
	} catch (error) {
		if (error.kind) {
			return res.status(404).json({ msg: 'Post not found' });
		}
		console.error(error);
		res.status(500).send('Server Error');
	}
});

// @route    PUT /api/posts/like/:post_id
// @desc     Like a post by ID
// @access   Private
router.put('/like/:post_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);

		if (!post) {
			return res.status(404).json({ msg: 'Post not found' });
		}

		if (post.likes.some((like) => like.user.toString() === req.user.id)) {
			return res.status(400).json({ msg: 'Post already liked' });
		}

		post.likes.unshift({ user: req.user.id });
		await post.save();
		res.json(post.likes);
	} catch (error) {
		if (error.kind) {
			return res.status(404).json({ msg: 'Post not found' });
		}
		console.error(error);
		res.status(500).send('Server Error');
	}
});

// @route    PUT /api/posts/unlike/:post_id
// @desc     Unlike a post by ID
// @access   Private
router.put('/unlike/:post_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);

		if (!post) {
			return res.status(404).json({ msg: 'Post not found' });
		}

		if (!post.likes.some((like) => like.user.toString() === req.user.id)) {
			return res.status(400).json({ msg: 'Post has not been liked yet' });
		}

		// remove like
		post.likes = post.likes.filter((like) => {
			return like.user.toString() !== req.user.id;
		});
		await post.save();
		res.json(post.likes);
	} catch (error) {
		if (error.kind) {
			return res.status(404).json({ msg: 'Post not found' });
		}
		console.error(error);
		res.status(500).send('Server Error');
	}
});

// @route    POST /api/posts/comment/:post_id
// @desc     Create a comment to post
// @access   Private
router.post(
	'/comment/:post_id',
	[auth, [check('text', 'Text is required').not().isEmpty()]],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const user = await User.findById(req.user.id).select('-password');
			const post = await Post.findById(req.params.post_id);

			const comment = {
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id
			};

			post.comments.unshift(comment);

			await post.save();
			res.status(201).json(post.comments);
		} catch (error) {
			console.error(error);
			res.status(500).send('Server Error');
		}
	}
);

// @route    DELETE /api/posts/comment/:post_id/:comment_id
// @desc     Delete a comment from a post
// @access   Private
router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);

		if (!post) {
			return res.status(404).json({ msg: 'Post not found' });
		}

		// find the comment
		const comment = post.comments.find(
			(comment) => comment.id === req.params.comment_id
		);

		// check if it exists
		if (!comment) return res.status(404).json({ msg: 'Comment not found' });

		// check that user owns the comment
		if (comment.user.toString() !== req.user.id) {
			return res
				.status(401)
				.json({ msg: 'Cannot delete comments of another user' });
		}

		post.comments = post.comments.filter((comment) => {
			return comment.id !== req.params.comment_id;
		});

		await post.save();
		res.status(200).json(post.comments);
	} catch (error) {
		if (error.kind) {
			return res.status(404).json({ msg: 'Post not found' });
		}
		console.error(error);
		res.status(500).send('Server Error');
	}
});

module.exports = router;
