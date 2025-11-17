const express = require('express');
const { createTodos, getTodos, updateTodos, deleteTodos } = require('../controllers/todos.controllers');
const { auth } = require('../middleware/auth.middleware');
const router = express.Router();

router.post('/create-todo', auth, createTodos);
router.get('/get-list', auth, getTodos);
router.put('/update-todo/:id', auth, updateTodos);
router.delete('/delete-todo/:id', auth, deleteTodos);

module.exports = router;