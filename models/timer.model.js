let timersList = [];

const addTimer = (timerObject) => {
  const timerId = timersList.push(timerObject);
  return timerId - 1;
}

const getTimer = (timerId) => {
  const objectList = timersList.slice(timerId, timerId + 1);
  const timerObject = objectList[0];
  return timerObject;
}

const nullifyTImer = (timerId) => {
  const objectList = timersList.splice(timerId, 1, null);
  return objectList ? true : false;
}

const updateTimeout = (timerId, timeoutObject) => {
  const timerObject = timersList[timerId];
  const updatedObject = {...timerObject, ...timeoutObject};
  const updatedList = timersList.splice(timerId, 1, updatedObject);
  return updatedList ? true : false;
}

const updateInterval = (timerId, intervalObject) => {
  const timerObject = timersList[timerId];
  const updatedObject = {...timerObject, intervalId: intervalObject};
  const updatedList = timersList.splice(timerId, 1, updatedObject);
  return updatedList ? true : false;
}

module.exports = {
  addTimer,
  getTimer,
  nullifyTImer,
  updateTimeout,
  updateInterval
};