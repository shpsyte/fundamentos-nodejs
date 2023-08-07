import express from 'express';
import { randomUUID } from 'node:crypto';
import zod from 'zod';


const app = express();
app.use(express.json());

/**
 * cpf - string
 * name - string 
 * id - uuid
 * statement - []
 */

const customers = [];

app.get('/account/', (request, response) => {
  return response.json(customers);
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

app.get('/statement/:cpf', (request, response) => {
  const { cpf } = request.params;
  const customer = customers.find(customer => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: 'Customer not found' });
  }
  
  return response.json(customer.statement);
})

app.listen(3333, () => {
  console.log('Server is running on port 3333');
})

