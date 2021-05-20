const TaskModel = require('../models/task.model');
const { getTimer, nullifyTImer, updateTimeout } = require('../models/timer.model');
const clientNotification = require('./notify');

function setTimeout_ (initialTimeout, isExpired, fn, timeout) {
  try {
    // const maxTimeout = Math.pow(2, 31) - 1;
    const maxTimeout = 60000;

    if (timeout < maxTimeout && initialTimeout === timeout) {
      console.log(`first use-case executed: timeout < & timeout ===`);
      // remove the initialTimeout  value, then call setTimeout with the arguments.
      let args = [...arguments];
      args.splice(0, 2);
      return setTimeout.apply(undefined, args);
    } else if(timeout < maxTimeout && initialTimeout !== timeout) {
      console.log(`second use-case executed: timeout < & timeout !==`);
      // get the task from arguments and query mongoose to get its timerId for update.
      let args = [...arguments];
      const task = args[5];
      TaskModel.findById(task._id, (err, res) => {
        if(err) return console.log(`Task data for taskId: ${task._id} not found.`);

        args.splice(0, 2);
        const timer_id = res.timer_id;
        console.log(`setTimeout retrieved timer_id is: ${timer_id} for ${isExpired ? 'expiredTimeout' : 'warningTimeout'}`);
        const newTimer = setTimeout.apply(undefined, args);
        isExpired ? updateTimeout(timer_id, {expiredId: newTimer}) : updateTimeout(timer_id, {timeoutId: newTimer});
      });
    } else if (timeout > maxTimeout && initialTimeout === timeout) {
      console.log(`third use-case executed: timeout > & timeout ===`);
      let args = arguments;
      args[3] -= maxTimeout;

      return setTimeout(function () {
        setTimeout_.apply(undefined, args);
      }, maxTimeout)
    } else if (timeout > maxTimeout && initialTimeout !== timeout) {
      console.log(`fourth use-case executed: timeout > & timeout !==`);
      let args = arguments;
      args[3] -= maxTimeout;
      const task = args[5];
    
      TaskModel.findById(task._id, (err, res) => {
        if(err) return console.log(`Task data for taskId: ${task._id} not found.`);
        
        const timer_id = res.timer_id;
        console.log(`setTimeout retrieved timer_id is: ${timer_id} for ${isExpired ? 'expiredTimeout' : 'warningTimeout'}`);
        const newTimer = setTimeout(function () {
          setTimeout_.apply(undefined, args);
        }, maxTimeout)
        isExpired ? updateTimeout(timer_id, {expiredId: newTimer}) : updateTimeout(timer_id, {timeoutId: newTimer});
      });
    }
  } catch (err) {
    console.log(`Error occured in the setTimeout_ function: ${err}`);
    return 0;
  }
}

function setInterval_ (initialInterval, fn, interval) {
  const maxInterval = Math.pow(2, 31) - 1;

  if(interval > maxInterval) {
    let args = arguments;
    args[2] -= maxInterval;

    return setTimeout(function() {
      setInterval_.call(undefined, args);
    }, maxInterval);
  }

  // if remainder interval is less than max interval, add that to initial interval and run recursion again.
  if(interval < maxInterval && initialInterval !== interval) {
    const args = arguments;
    const newInterval = initialInterval + interval;
    let newArgs = [...args];
    newArgs[2] = newInterval;
    // ensure that the outstanding time interval is counted and notification is sent to frontend.
    setTimeout.call(undefined, args);
    // start another interval countdown for the task and return its id.
    setInterval_.call(undefined, newArgs);
  } else if(initialInterval < maxInterval && initialInterval === interval) {
    let args = [...arguments];
    args.splice(0, 1);
    return setInterval.call(undefined, args);
  }
}

// function to update the task status on the database.
const updateDatabase = async (getPayload, task, cancelTimers) => {
  try {
    console.log('update database taskId', task._id);
    const taskData = await TaskModel.findById(task._id) || task;
    const dataObject = taskData.toObject();
    const payload = getPayload(dataObject);
      
    // taskData-populate to update status and send client notification.
    taskData.populate('user', 'token', (err, task) => {
      let userToken;
      if(err) throw Error(err);
      userToken = task.user.toObject().token;
      // find by Id and update, if the data already exists/saved on database.
      TaskModel.findById(task._id, (err, data) => {
        if(err) {
          return console.error('Taskmodel findbyId failed: ', err);
        } else if(data) {
          data.status = payload.data.status;
          data.save().then(savedData => {
            console.log('Task status updated successfully', savedData);
          }).catch(err => {
            console.error('Data save was UNSUCCESSFUL: ', err);
          });
        } else console.log('Task find did not retrieve any result', data);
      });

      clientNotification(userToken, payload);
      
      if(cancelTimers) {
        const timerIds = getTimer(task.timer_id);
        console.log('Cancel timers is available - expired timeout')
        // ensure that the timer hasn't been nullified by another task already.
        if(timerIds !== null && timerIds !== undefined) {
          console.log('cancel timers was called effectively');
          cancelTimers(timerIds, task.timer_id);
        } else console.log('cancel timer was not called. timerId is: ', timerIds);
      }

      console.log('Update database user token is: ', userToken);
    });
  } catch (error) {
    console.log('Update database error occured', error);
  }
} 

const setExpiredTimeout = (task) => {
  try {
    let timeoutId = 0;
    const dueDate = Date.parse(task.due_date);
    const currentDate = Date.parse(new Date())
    const timeout = dueDate - currentDate;
    console.log('expired timeout current date: ', currentDate, timeout);

    const getPayload = (dataObject) => {
      const payload = {
        notification: {
          title: 'Expired Task Notification!',
          body: `Your task ${dataObject.task_name} has expired, and is yet to be completed.
          \n Due Date: ${new Date(dataObject.due_date).toLocaleString()}`,
        },
        data: {
          _id: dataObject._id.toString(),
          status: 'expired',        
        }
      }
      return payload;
    }

    const cancelTimers = (timerIds, timer_id) => {
      clearInterval(timerIds.intervalId);
      clearTimeout(timerIds.timeoutId);

      const isNullified = nullifyTImer(timer_id);
      console.log('Cancel timers, is nullified has a value of: ', isNullified);
    }

    timeoutId = setTimeout_(timeout, true, updateDatabase, timeout, getPayload, task, cancelTimers);
    console.log('expired timeout Id: ', timeoutId);
    return timeoutId;
  } catch (error) {
    console.log('Expired timeout error occured: ', error);
    throw Error(error);
  }
}

const setWarningTimeout = (task) => {
  // make a subtraction from the set date and the due date, to get the 70% mark
  // where a warning is sent to the client after.
  try {
    let timeoutId = 0;
    const dueDate = Date.parse(task.due_date);
    const setDate = Date.parse(task.set_date);
    const warningDate = ((dueDate - setDate) * 0.7) + setDate;
    console.log(warningDate);
    const currentDate = Date.parse(new Date());
    console.log(currentDate);
    console.log('warning date: ', new Date(warningDate).toLocaleString());
    console.log('current date: ', new Date(currentDate).toLocaleString())

    const getPayload = (dataObject) => {
      const payload = {
        notification: {
          title: 'Warning!! Task Reminder!',
          body: `Task Warning! Your task ${dataObject.task_name} is set to be due soon! \n Due Date: ${new Date(dataObject.due_date).toLocaleString()}`,
        },
        data: {
          _id: dataObject._id.toString(),
          status: 'warning',        
        }
      }
      return payload;
    }

    if (warningDate > currentDate) {
      const timeout = warningDate - currentDate;
      console.log('Timeout in milliseconds: ', timeout);
      timeoutId = setTimeout_(timeout, false, updateDatabase, timeout, getPayload, task)
    } else {
      const timeout = currentDate - warningDate;
      console.log('Warning date had passed, before setTimeout was called.', timeout);
      updateDatabase(getPayload, task);
    }
    return timeoutId;
  } catch (error) {
    console.log('Warning timeout error occured: ', error);
    throw Error(error);
  }
}

const createInterval = async (task) => {
  const payload = {
    notification: {
      title: 'Task Reminder Notification',
      body: `Your task ${task.task_name} is set to be due on ${new Date(task.due_date).toLocaleString()}`
    }
  }
  const intervalList = task.reminder_interval.split(" ");
  const timeInteger = parseInt(intervalList[0]);
  const taskId = task._id;
  console.log('interval taskId: ', taskId);

  let timerId = 0;

  try {
    const taskData = await TaskModel.findById(taskId) || task;
    const tokenData = taskData.execPopulate('user', 'token');
    console.log('token-data', tokenData);
    const returnedData = await tokenData;
    const userToken = returnedData.toObject().user.token;

    let interval = 0;

    console.log('Create interval user token is: ', userToken);

    if(taskData.reminder_interval.includes('test')) {
      interval = 5000;
      console.log('interval console', interval);
      console.log('user token', userToken);
      timerId = setInterval(clientNotification, interval, userToken, payload);
    }
    else if (taskData.reminder_interval.includes('hour')) {
      interval = 1000 * 60 * 60 * timeInteger;
      console.log('interval console', interval);
      console.log('user token', userToken);
      timerId = setInterval(clientNotification, interval, userToken, payload);
    } else if (taskData.reminder_interval.includes('day')) {
      interval = 1000 * 60 * 60 * 24 * timeInteger;
      console.log('interval console', interval);
      console.log('user token', userToken);
      timerId = setInterval(clientNotification, interval, userToken, payload);
    } else if (taskData.reminder_interval.includes('week')) {
      interval = 1000 * 60 * 60 * 24 * 7 * timeInteger;
      console.log('interval console', interval);
      console.log('user token', userToken);
      timerId = setInterval(clientNotification, interval, userToken, payload);
    } else if(taskData.reminder_interval.includes('month')) {
      interval = 1000 * 60 * 60 * 24 * 30 * timeInteger;
      console.log('interval console', interval);
      console.log('user token', userToken);
      timerId = setInterval(clientNotification, interval, userToken, payload);
    }

    console.log('create-interval timer id: ', timerId);
  } catch (err) {
    console.log('error occured @ createInterval', err);
  }

  return timerId;
}

module.exports = {
  setWarningTimeout,
  setExpiredTimeout,
  createInterval
};
