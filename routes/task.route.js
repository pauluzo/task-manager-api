const express = require('express');
const router = express.Router();

const TaskModel = require('../models/task.model');
const User = require('../models/user.model');

// post route foe creating a new task for a user
router.post('/:id', async (req, res) => {
  const body = req.body;
  const userId = req.params.id

  try {
    const task = new TaskModel({...body, user: userId});
    await task.save();

    const userById = await User.findById(userId);
    userById.tasks.push(task);

    await userById.save();

    console.log("The task is: ", task);
    res.status(200).json(`Task created successfully: ${task}`)
  } catch (error) {
    console.log('Error occured: ' + error);
    res.status(500).json(`Error occured: ${error}`);
  }
});

router.put('/:id', async (req, res) => {
  const body = req.body;
  const id = req.params.id;

  try {
    const task = await TaskModel.findById(id);
    const taskUpdate = {...task.toObject(), ...body};

    await task.updateOne(taskUpdate);
    console.log('Task update is: ',taskUpdate);

    res.status(200).json(`Task Updated successfully ${task}`);
  } catch (error) {
    res.status(404).send(`Error occured: ${error}`);
  }
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const taskId = await TaskModel.findByIdAndDelete(id);
    console.log('task deleted successfully: ', taskId);

    res.status(200).json(`Task deleted successfully. ${taskId}`);
  } catch(error) {
    res.status(404).send(`Error occured: + ${error}`);
  }
});

module.exports = router;
