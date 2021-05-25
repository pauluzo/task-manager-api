const express = require('express');
const router = express.Router();

const TaskModel = require('../models/task.model');
const UserModel = require('../models/user.model');

const {setTimer, editInterval, editTimeout, deleteTimers} = require("../logic/timerLogic");
const { verifyToken } = require('../utils/auth');

// post route for creating a new task for a user
router.post('/', verifyToken, async (req, res) => {
  const {postTask, userEmail} = req.body;

  try {
    const userData = await UserModel.findOne({"user_details.email" : userEmail}).lean().exec();
    const userId = userData._id;
    console.log('the user data & id is: ', userData, userId);
    
    const validateData = new TaskModel({...postTask, user: userId});
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

    const responseData = {
      task_name : savedData.task_name,
      task_description : savedData.task_description,
      reminder_interval : savedData.reminder_interval,
      due_date : savedData.due_date,
      set_date : savedData.set_date,
      status : savedData.status
    }

    res.status(200).send(responseData);
  } catch (err) {
    console.log('Error occured: ' + err);
    res.status(500).json({error : 'Error occured: ' + err});
  }
});

router.put('/', verifyToken, async (req, res) => {
  // client should send only the necessary updated fields.
  // data must contain the set-date.
  const body = req.body;

  try {
    console.log('The task PUT router is called with data: ', body);
    const task = await TaskModel.findOne({set_date : body.set_date}).lean().exec();
    console.log('The task received is: ', task)
    let taskUpdate = {...task, ...body};
    console.log('The task retrieved and task update are: ', task, taskUpdate);

    await TaskModel.findByIdAndUpdate(task._id, taskUpdate);

    if(taskUpdate.status === "expired") {
      const timer_id = await setTimer(taskUpdate);
      console.log('the returned timer is: ', timer_id);
      const updateTimerId = await TaskModel.findByIdAndUpdate(taskUpdate._id, {timer_id, status: "active"}, {new: true}).lean().exec();
      console.log('The timer-id and active status is changed.', updateTimerId);

      const responseData = {
        task_name : updateTimerId.task_name,
        task_description : updateTimerId.task_description,
        reminder_interval : updateTimerId.reminder_interval,
        due_date : updateTimerId.due_date,
        set_date : updateTimerId.set_date,
        status : updateTimerId.status
      }
      return res.status(200).json(responseData);
    } else if(taskUpdate.status === "warning") {
      taskUpdate = {...taskUpdate, status: "active"};
      await TaskModel.findByIdAndUpdate(taskUpdate._id, {status: "active"});
      if(!body.due_date) {
        console.log('Edited task is has warning status, but no due_date');
        const timer_id = editTimeout(taskUpdate);
        console.log('Timeout id was changed successfully. ', timer_id);
      }
    }

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

    // conditional for when the task is completed.
    if(body.status && body.status === 'completed') {
      console.log('this task has been completed successfully.');
      deleteTimers(taskUpdate);
    }

    const responseData = {
      task_name : taskUpdate.task_name,
      task_description : taskUpdate.task_description,
      reminder_interval : taskUpdate.reminder_interval,
      due_date : taskUpdate.due_date,
      set_date : taskUpdate.set_date,
      status : taskUpdate.status
    }

    res.status(200).json(responseData);

  } catch (err) {
    console.log('error occured' + err);
    res.status(500).json({error : 'Error occured: ' + err});
  }
});

router.delete('/', verifyToken, async (req, res) => {
  const data = req.data || req.body;

  try {
    const task = await TaskModel.findOne({set_date : data.set_date}).lean().exec();
    const deletedTask = await TaskModel.findByIdAndDelete(task._id);
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
