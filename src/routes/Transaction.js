let Transaction = require('../models/Transaction.model')
let express = require('express')
let router = express.Router()

var moment = require('moment')

//Sort objects dynamically , key accept attribure and order to specify the order in which you want to sort
function sorting(key, order='asc') {
  return function(a, b) {
	const varA = (typeof a[key] === 'string') ? a[key].toUpperCase() : a[key];
	const varB = (typeof b[key] === 'string') ? b[key].toUpperCase() : b[key];
	let comparison = 0;
	if (varA > varB) {
	  comparison = 1;
	} else if (varA < varB) {
	  comparison = -1;
	}
	return (
	  (order == 'desc') ? (comparison * -1) : comparison
	);
  };
}
// API call to get all the recurring transactions till to date
// Desc: First make query to get all recurring transaction from DB, and wrap them in the requrired  output format 
router.get('/',(req,res)=>{
	Transaction.find({is_recurring : true})
	.then(docs =>{
		docs.sort(sorting('company_name'));
		let dictionary = {} 
		docs.forEach(function(doc){
			if(!dictionary[doc.company_name]){
				dictionary[doc.company_name] = []
			}
			dictionary[doc.company_name].push(doc)
		})
		let response = []
		Object.keys(dictionary).forEach(function(company_name){
			dictionary[company_name].sort(sorting('date','desc'))
			var a = moment(dictionary[company_name][0]["date"])
			var b = moment(dictionary[company_name][1]["date"])
			Days_Difference =  Math.abs(a.diff(b, 'days'))
			nxt_date = moment(new Date(dictionary[company_name][0]['date'])).add(Days_Difference,'days')
			let company = {
				name : dictionary[company_name][0]['name'],
				user_id : dictionary[company_name][0]['user_id'], 
				next_amt: dictionary[company_name][0]['amount'],
				next_date: nxt_date,
				transactions : dictionary[company_name]	
			}
			response.push(company)
		})
		res.send(response)
	
	})
	.catch(err =>{
		res.status(500).json(err)	
	})	
})  

// Post Localhost:1984/  Api call for Upsert Transactions
// Desc: Traverse through each object from request. Add them one by one and check whether it is a recurring one or not -
// - if new transactions is recurring then update DB accordingly. For output First make query to get all recurring transaction -
// -from DB, and wrap them in the requrired  output format
router.post('/',(req,res)=>{
	if(!req.body){
		return res.status(400).send('Request Body is missing')
	}
	var i = 0
	function step(i){
		if (i < req.body.length){
			let model = new Transaction(req.body[i])
			company_name_lst =  model['name'].split(' ')
			model['company_name'] =  model['name']
			if (company_name_lst.length > 1 && !isNaN(company_name_lst[(company_name_lst.length -1)])){
				company_name_lst.pop()
				model['company_name'] = company_name_lst.join(' ')
			}
			Transaction.find({'amount' : model['amount'], company_name : model['company_name']})
			.then(doc =>{  
				if(doc.length > 0){
					if(doc[0]["is_recurring"] == true){
						model['is_recurring'] = true
						model.save()
						.then(doc =>{step(i + 1)})
						.catch(err =>{res.status(500).json(err)})
					}
					else{	
							var a = moment(doc[0]['date'])
							var b = moment(model['date'])
							Days_Difference =  Math.abs(a.diff(b, 'days'))
							if([7,15,30,31,28,365,366].indexOf(Days_Difference) > -1){
								model.save()
								.then(doc =>{
									Transaction.update({'amount' : model["amount"]},{$set :{ 'is_recurring' : true }},{ multi : true })
									.then(doc => {step(i + 1)})
									.catch(err =>{res.status(500).json(err)})
								})
								.catch(err =>{res.status(500).json(err)})	
							}
							else{
									model.save()
									.then(doc =>{step(i + 1)})
									.catch(err =>{res.status(500).json(err)})
								}
					}
				}
				else{
					model.save()
					.then(doc =>{step(i + 1)})
					.catch(err =>{res.status(500).json(err)})
				} 
			})
			.catch( err => {res.status(500).json(err)})	
		}
		else {
			Transaction.find({is_recurring : true})
			.then(docs =>{
				docs.sort(sorting('company_name'));
				let dictionary = {} 
				docs.forEach(function(doc){
					if(!dictionary[doc.company_name]){
						dictionary[doc.company_name] = []
					}
					dictionary[doc.company_name].push(doc)
				})
				let response = []
				Object.keys(dictionary).forEach(function(company_name){
					dictionary[company_name].sort(sorting('date','desc'))
					var a = moment(dictionary[company_name][0]["date"])
					var b = moment(dictionary[company_name][1]["date"])
					Days_Difference =  Math.abs(a.diff(b, 'days')) + 1
					nxt_date = moment(new Date(dictionary[company_name][0]['date'])).add(Days_Difference,'days')
					let company = {
						name : dictionary[company_name][0]['name'],
						user_id : dictionary[company_name][0]['user_id'], 
						next_amt: dictionary[company_name][0]['amount'],
						next_date: nxt_date,
						transactions : dictionary[company_name]	
					}
					response.push(company)
				})
				res.send(response)
			
			})
			.catch(err =>{res.status(500).json(err)})
		}	
	}
	step(0)		
})




//get all  transaction Use this call to check api no response timeout, after 10s it will send message to client.
router.get('/transaction/all',(req,res)=>{
	if(!req.query){
		return res.status(400).send('Request Body is missing')
	}
	TransactionModel.find({})
	.then(doc =>{ setInterval(function(){ console.log("Hello"); }, 1000);})
	.catch( err => {res.status(500).json(err)})
} ) 


module.exports = router