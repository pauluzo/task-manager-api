const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new Schema({
  task_name: {type: String, required: true},
  task_description: {type: String, required: true},
  reminder_interval: {type: String, required: true},
  due_date: {type: Date, required: true},
  set_date: {type: Date, required: true},
  status: {type: String, required: true},
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  timer_id: {type: Number}
}, {
  timestamps: true
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;