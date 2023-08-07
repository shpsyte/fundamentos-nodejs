import { customers } from './db.js';


export function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;
  const customer = customers.find(customer => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: 'Customer not found' });
  }

  // Passando o customer para o request
  request.customer = customer;

  return next();
}

export function getBalance(statement) {
  const balance = statement.reduce((acc, current) => {
    if (current.type === 'credit') {
      return acc + current.amount;
    } else {
      return acc - current.amount;
    }

  }, 0)
  return balance;
}