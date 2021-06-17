const express = require("express");
const { setTimer } = require("./logic/timerLogic");
const TaskModel = require("./models/task.model");
require("dotenv").config();
const app = express();

require("./config/prod")(app);
require("./config/db")();
require("./config/routes")(app);

const setTaskTimers = async () => {
  // Logic for app to get all tasks and re-assign timers to them.
  const allTasks = await TaskModel.find({}).lean().exec();
  console.log('Server was restarted, no of active tasks is: ', allTasks.length);

  for (let index = 0; index < allTasks.length; index++) {
    const taskData = allTasks[index];
    const dueDate = new Date(taskData.due_date).getTime();
    const timeNow = new Date().getTime();

    if(
      (taskData.status === "active" || taskData.status === "warning") &&
      dueDate > timeNow
    ) {
      taskData.timer_id = null;
      const timer_id = await setTimer(taskData);
      console.log('Server restart timer-id is: ', timer_id);
      const updateTimerId = await TaskModel.findByIdAndUpdate(taskData._id, { timer_id }, {new: true}).lean().exec();
      console.log('The timer-id is changed.', updateTimerId);
    }
  }
}

/**
 * setTimeout(() => {
  setTaskTimers().catch(err => {
    console.log('Error occured in reseting timer: ' + err)
  });
 }, 30000);
 */

let PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ⚙ 🔥`);
});
