const express = require('express');
const router = express.Router();

const TaskModel = require('../models/task.model');
const UserModel = require('../models/user.model');
const timerModel = require('../models/timer.model');

const {setTimer, editInterval, editTimeout, deleteTimers} = require("../logic/timerLogic");

// post route for creating a new task for a user
router.post('/:id', async (req, res) => {
  const body = req.body;
  const userId = req.params.id

  try {
    const validateData = new TaskModel({...body, user: userId});
    const validateError = validateData.validateSync();
    if(validateError) throw Error(validateError);

    // before saving the task to the Task.Model, set the timers.
    const timer_id = await setTimer(validateData);
    console.log('The improvised timerId is: ', timer_id);

    const updatedData = {...validateData.toObject(), timer_id};
    const task = new TaskModel(updatedData);
    const savedData = await task.save();
    
    console.log('Updated post task: ', savedData);

    const userById = await UserModel.findById(userId);
    userById.tasks.push(savedData);

    await userById.save();

    res.status(200).send(savedData);
  } catch (error) {
    console.log('Error occured: ' + error);
    res.status(500).json(`Error occured: ${error}`);
  }
});

router.put('/:id', async (req, res) => {
  // client should send only the necessary updated fields.
  const body = req.body;
  const id = req.params.id;

  try {
    const task = await TaskModel.findById(id);
    let taskUpdate = {...task.toObject(), ...body};

    await task.updateOne(taskUpdate);

    if (body.due_date) {
      console.log('updated due date: ', body.due_date);
      const timer_id = editTimeout(taskUpdate);
      console.log('Timeout id was changed successfully. ', timer_id);
    }

    if(body.reminder_interval || body.task_name || body.task_description) {
      console.log('updated body, except due-date');
      const interval_id = await editInterval(taskUpdate);
      console.log('Interval id was changed successfully. ', interval_id);
    }

    // write if conditional for when the task is completed.
    if(body.status && body.status === 'completed') {
      console.log('this task has been completed successfully.');
      deleteTimers(taskUpdate);
    }

    console.log('Does this wait for the async if conditionals?: ', taskUpdate);

    res.status(200).json(task);

  } catch (error) {
    res.status(404).send(`Error occured: ${error}`);
  }
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const deletedTask = await TaskModel.findByIdAndDelete(id);
    const userById = await UserModel.findByIdAndUpdate(deletedTask.user, {
      $pull: {tasks: deletedTask._id}
    }, {new: true});

    if(userById) console.log("The updated user task is: ", userById);

    console.log('task deleted successfully: ', deletedTask);
    const isDeleted = deleteTimers(deletedTask);

    res.status(200).json(`Task deleted successfully. ${isDeleted}`);
  } catch(error) {
    res.status(404).send(`Error occured: + ${error}`);
  }
});

module.exports = router;
