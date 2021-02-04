const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const detailsSchema = new Schema({
  name: {type: String, required: true},
  password: {type: String, required: true},
  email: {type: String, required: true},
}, {
  timestamps: true
});

const userSchema = new Schema({
  user_details: {type: detailsSchema, required: true},
  tasks: [{type: Schema.Types.ObjectId, ref: 'Task'}],
  token: {type: String, required: true},
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;
