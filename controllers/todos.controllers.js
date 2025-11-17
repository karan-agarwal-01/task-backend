const Todos = require("../models/Todos")

exports.createTodos = async (req, res) => {
    try {
        const todo = await Todos.create({
            title: req.body.title,
            completed: req.body.completed || false,
            user: req.user._id
        });
        res.status(201).json(todo);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error'})
    }
}

exports.getTodos = async (req, res) => {
    try {
        const todos = await Todos.find({ user: req.user._id });
        res.json(todos);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.updateTodos = async (req, res) => {
    try {
        const updateTodo = await Todos.findByIdAndUpdate({_id: req.params.id, user: req.user._id}, req.body, { new: true })
        if (!updateTodo) {
            return res.status(404).json({ message: "Todo not found" });
        }
        res.json(updateTodo);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.deleteTodos =  async (req, res) => {
    try {
        const deleted = await Todos.findByIdAndDelete({_id: req.params.id, user: req.user._id});
        if (!deleted) {
            return res.status(404).json({ message: "Todo not found" });
        }
        res.json({ message: "Todo Deleted" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server Error' })
    }
}