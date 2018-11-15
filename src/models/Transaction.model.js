let mongoose = require('mongoose')

mongoose.connect('mongodb://localhost:27017/Transaction_DB')

let TransactionSchema = new mongoose.Schema({
	name: {
		type : String,
		required : true
		} ,
	date : String,
	amount : {
		type : Number, 
		required : true
	},
	trans_id : {
		type : String,
		required : true
		} ,
	user_id : {
		type : String, 
		required : true
	},
	is_recurring : {
		type: Boolean,
		default: false
	},
	company_name :{
		type: String, 
		default : ''
	}
})

module.exports = mongoose.model('Transaction',TransactionSchema)
