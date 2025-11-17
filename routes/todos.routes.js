const express = require('express');
const { createTodos, getTodos, updateTodos, deleteTodos } = require('../controllers/todos.controllers');
const router = express.Router();

router.post('/create-todo', createTodos);
router.get('/get-list', getTodos);
router.put('/update-todo/:id', updateTodos);
router.delete('/delete-todo/:id', deleteTodos);

module.exports = router;