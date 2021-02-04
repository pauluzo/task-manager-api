// object to house helper logic to create new task, edit timeout and interval tasks.
const {createInterval, setWarningTimeout, setExpiredTimeout} = require('./utilityLogic');
const {getTimer, updateTimeout, updateInterval, addTimer, nullifyTImer} = require('../models/timer.model');

const setTimer = async (task) => {
  try {
    const expiredId = setExpiredTimeout(task);
    const timeoutId = setWarningTimeout(task);
    const intervalId = await createInterval(task);

    console.log('intervalId: ', intervalId);
    console.log('warningId: ', timeoutId);
    console.log('ExpiredId: ', expiredId);

    const timerId = addTimer({timeoutId, expiredId, intervalId});

    return timerId;

  } catch (err) {
    console.log('edit-timeout: error occured', err);
    return undefined;
  }
}

const editInterval = async (task) => {
  try {
    const {timer_id} = task;
    console.log('edit interval timer_id is: ', timer_id);
    const objectIds = getTimer(timer_id);
    console.log('edit interval - object id:', objectIds);
    const {intervalId} = objectIds;

    clearInterval(intervalId);
    const newId = await createInterval(task);
    const updatedTimer = updateInterval(timer_id, newId);
    return updatedTimer;
  } catch (err) {
    console.log('edit-interval: error occured', err);
    return undefined;
  }
}

const editTimeout = (task) => {
  try {
    const {timer_id} = task;
    const objectIds = getTimer(timer_id);
    const {timeoutId, expiredId} = objectIds;

    clearTimeout(timeoutId);
    clearTimeout(expiredId);
    const newTimeoutId = setWarningTimeout(task);
    const newExpiredId = setExpiredTimeout(task);
    const newObject = {timeoutId: newTimeoutId, expiredId: newExpiredId};
    const updatedTimer = updateTimeout(timer_id, newObject);
    console.log('warningId: ', newTimeoutId);
    console.log('expiredId: ', newExpiredId);
  
    return updatedTimer;
  } catch (err) {
    console.log('edit-timeout: error occured', err);
    return undefined;
  }
}

const deleteTimers = (task) => {
  try {
    const {timer_id} = task;
    const objectIds = getTimer(timer_id);
    if(objectIds === null) {
      console.log('The deleted timer returns a null object');
      return true;
    }

    const {intervalId, timeoutId, expiredId} = objectIds;
    clearInterval(intervalId);
    clearTimeout(timeoutId);
    clearTimeout(expiredId);
    const isNullified = nullifyTImer(timer_id);
    console.log('Is nullified has a value of: ', isNullified);
    return isNullified;
  } catch (err) {
    console.log('delete timers error: ', err);
  }
}

module.exports = {
  setTimer,
  editInterval,
  editTimeout,
  deleteTimers
};
