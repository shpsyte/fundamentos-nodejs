import express from 'express';
import { randomUUID } from 'node:crypto';
import zod from 'zod';
import { getBalance, verifyIfExistsAccountCPF } from './middlewares.js';
import { customers } from './db.js'

const app = express();
app.use(express.json());


app.get('/account/', verifyIfExistsAccountCPF , (request, response) => {
  const { customer } = request;
  return response.json(customer);
})

app.post('/account', (request, response) => {
  const { cpf, name } = request.body;
  const id = randomUUID();
  
  var schema = zod.object({
    cpf: zod.string().min(1).max(11),
    name: zod.string(),
  })
  
  
  try {
    var customer = { id, ...schema.parse(request.body), statement: []}
  } catch (error) {
    // console.log('error ==>>> ', error);
     return response.status(400).json({ error });
  }

  if (!customers.some(customer => customer.cpf === cpf)) {
    customers.push(customer);
  }  else {
    return response.status(400).json({ error: 'CPF already exists' });
  }
  
  return response.status(201).json(customer);
})


app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
})

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  const { description, amount } = request.body;

  const schema = zod.object({
    description: zod.string(),
    amount: zod.number().positive(),
  })


  try {
    var statementOperation = {
      created_at: new Date(),
      type: 'credit',
      ...schema.parse(request.body)
    } 
  } catch (error) {
    return response.status(400).json({ error });
  }

  customer.statement.push(statementOperation);

  return response.status(201).json(statementOperation);

})

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  const { amount } = request.body;

  const balance= getBalance(customer.statement);
  if (balance < amount) {
    return response.status(400).json({ error: 'Insufficient funds!' });
  }

  const schema = zod.object({
    amount: zod.number().positive(),
  })

  try {
    var statementOperation = {
      created_at: new Date(),
      type: 'debit',
      ...schema.parse(request.body)
    } 

  } catch (error) {
    return response.status(400).json({ error });
  }

  customer.statement.push(statementOperation);
  return response.status(201).json(statementOperation);
})

app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + ' 00:00');

  const statement = customer.statement.filter(statement => statement.created_at.toDateString() === new Date(dateFormat).toDateString());

  return response.json(statement);



})

app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  const { name } = request.body;

  customer.name = name;

  return response.status(201).json(customer);

})

app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  customers.splice(customer, 1);
  return response.status(200).json(customers);
})

app.get('/balance', verifyIfExistsAccountCPF, (request, response) => {
   const { customer } = request;
   const balance = getBalance(customer.statement);

   const restult = {
      name: customer.name,
      cpf: customer.cpf,
      balance: balance,
      history: customer.statement.map(statement => {
        return {
          type: statement.type,
          amount: statement.amount,
          date: statement.created_at
        }
      }
      )
   }


  return response.status(200).json(restult);


})

app.listen(3333, () => {
  console.log('Server is running on port 3333');
})

