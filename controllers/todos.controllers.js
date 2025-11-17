const Todos = require("../models/Todos")

exports.createTodos = async (req, res) => {
    try {
        const todo = await Todos.create(req.body);
        res.status(201).json(todo);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error'})
    }
}

exports.getTodos = async (req, res) => {
    try {
        const todos = await Todos.find();
        res.json(todos);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.updateTodos = async (req, res) => {
    try {
        const updateTodo = await Todos.findByIdAndUpdate(req.params.id, req.body, { new: true })
        res.json(updateTodo);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.deleteTodos =  async (req, res) => {
    try {
        await Todos.findByIdAndDelete(req.params.id);
        res.json({ message: "Todo Deleted" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server Error' })
    }
}