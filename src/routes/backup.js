
// THis is a backup api contains all the possible calls related to transactions
// I have created this to test the api with my test cases


let TransactionModel = require('../models/Transaction.model')
let express = require('express')
let router = express.Router()
var moment = require('moment')


// Create new Transaction 
// Post Localhost:1984/transaction 

router.post('/transaction',(req,res)=>{
	if(!req.body){
		return res.status(400).send('Request Body is missing')
	}
	let model = new TransactionModel(req.body)
	company_name_lst =  model['name'].split(' ')
	if (company_name_lst.length > 1){
		company_name_lst.pop()
		tmp = company_name_lst.join(' ')
		model['company_name'] = tmp
	}
	else{
		model['company_name'] =  model['name']
		}
	model.save() 
		.then(doc => {
			if(!doc || doc.length === 0){
				return res.status(500).send(doc)

			}
				res.status(200).send(doc)
		})
		.catch(err =>{
			res.status(500).json(err)
		})
})


//get specific transaction 

router.get('/transaction',(req,res)=>{
	if(!req.query.trans_id){
		return res.status(400).send('Missing URL parameter: Email')
	}
	TransactionModel.findOne({trans_id : req.query.trans_id, 	})
	.then(doc =>{res.json(doc)})
	.catch( err => {res.status(500).json(err)})
} )  

//Sort objects dynamically 

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

// get all the recurring transactions
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
} ) 
 

//get all  transaction 
router.get('/transaction/all',(req,res)=>{
	if(!req.query){
		return res.status(400).send('Request Body is missing')
	}
	TransactionModel.find({})
	.then(doc =>{res.json(doc)})
	.catch( err => {res.status(500).json(err)})
} ) 


//update transaction 
router.put('/transaction',(req,res) =>{
	if(!req.query){
		return res.status(400).send('Request Body is missing')
	}
	TransactionModel.findOneAndUpdate({trans_id : req.query.trans_id},req.body,{new : true})
	.then(doc =>{res.json(doc)})
	.catch( err => {res.status(500).json(err)})
})


//delete 
router.delete('/transaction/delete',(req,res) =>{
	if(!req.query.trans_id){
		return res.status(400).send('Missing URL parameter: trans_id and date')
	}
	TransactionModel.findOneAndRemove({trans_id : req.query.trans_id})
	.then(doc =>{res.json(doc)})
	.catch( err => {res.status(500).json(err)})
})

// UpsertTransaction 
// Post Localhost:1984/
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
			Transaction.find({'amount' : model["amount"],company_name : model['company_name']})
			.then(doc =>{  
				if(doc.length > 0){
					if(doc[0]["is_recurring"] == true){
						model['is_recurring'] = true
						model.save()
						.then(doc =>{step(i + 1)})
						.catch(err =>{res.status(500).json(err)})
					}
					else{	
							var a = moment(doc[0]["date"])
							var b = moment(model["date"])
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


module.exports = router