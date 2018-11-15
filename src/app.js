
//'includes express into '
let express = require('express')
var timeout = require('connect-timeout')
// create an express app 
let app = express()
let bodyparser = require('body-parser')
app.use(timeout('10s'))
app.use(bodyparser.json())
// app.use(haltOnTimedout)



let transactionRoute = require('./src/routes/Transaction.js')
let path = require('path')


app.use((req,res,next) => {
	console.log(`${new Date().toString()} => ${req.originalUrl}`)
	next()
})

app.use(transactionRoute)
app.use(express.static('public'))
// Handler for resource not found 
app.use((req,res,next)=>{
	res.status(404).send('We think you are lost')
})
// Handler for error 500 
app.use((err, req, res, next )=>{
	console.log(err.stack)
	res.sendFile(path.join(__dirname,'./public/500.html'))
})


const PORT = process.env.PORT || 1984
app.listen(PORT,() =>console.info(`Server has started on ${PORT}`))
