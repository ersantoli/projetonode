const { request, response } = require("express");
const express = require("express");
const {v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const customers= [];

//Middleware
function VerifyIfAccountExistsCPF(request, response, next){
    const {cpf} = request.headers;

    const customer= customers.find((customer) => customer.cpf === cpf);

    if(!customer){

        return response.status(400).json({error:"Customer not found"});
    }
    request.customer = customer;
        return next();
    
}
// Função withdraw
function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit'){
            return acc + operation.amount;
        }else{
            return acc - operation.amount;
        }

    },0);
    return balance;

}


app.post("/account", (request, response)=>{

    const{cpf,name} = request.body;
   
    //VAlidando o cpf

    const customerAlreadyExists = customers.some((customers)=>
    customers.cpf === cpf);
    if(customerAlreadyExists){
        return response.status(400).json({error:"Customer Already exists"})
    }

    
    const id = uuidv4();

    customers.push({
        cpf,
        name,
        id,
        statement:[],
    });
    return response.status(201).send();
    
});

//Listando Extrato
/*app.get("/statement/:cpf", (request, response) => {
    const { cpf } = request.params;
    const customer = customers.find((customer) =>
    customer.cpf === cpf);
    return response.json(customer.statement);
 
});*/

//validando a conta
/*app.get("/statement", (request, response) => {
    const { cpf } = request.headers; // recebendo dados pelo header

    const customer = customers.find((customer) =>  customer.cpf === cpf); 

    //Validando a conta com IF
    if(!customer){
        return response.status(400).json({error: "Customer not found"})
    }

    return response.json(customer.statement);
 
});*/
app.get("/statement", VerifyIfAccountExistsCPF, (request, response) => {
    const { customer } = request;

    


   

    return response.json(customer.statement);})

    //Criando um deposito em conta

    app.post("/deposit", VerifyIfAccountExistsCPF,(request, response) =>{

        const {description, amount} = request.body;

        const { customer } = request;

        const statementOperation = {
            description,
            amount,
            created_at: new Date(),
            type:"credit",
        };

        customer.statement.push(statementOperation);
        return response.status(201).send();
    });

    app.post("/withdraw", VerifyIfAccountExistsCPF,(request, response)=>{
        const { amount } = request.body; 
        const { customer } = request;

    const balance = getBalance(customer.statement); 

    //Validando a conta com IF
    if(balance < amount){
        return response.status(400).json({error: "insufficient funds!"})
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type:"debit",
    };

    customer.statement.push(statementOperation);

    return response.status(201).send()
    })

    //EXTRATO BANCARIO POR DATA

    app.get("/statement/date",VerifyIfAccountExistsCPF, (request, response) => {
        const { customer } = request;
        const { date } = request.query;

        const dateFormat = new Date(date + " 00:00");
        const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString()
        );
     
        return response.json(statement);
    });

    //ATUALIZANDO DADOS DA CONTA
    app.put("/account", VerifyIfAccountExistsCPF, (request, response)=>{
        const { name } = request.body;
        const { customer } = request;
        customer.name = name;
        return response.status(201).send();

    });

    //retornar dados da conta
    app.get("/account", VerifyIfAccountExistsCPF,(request ,response) => {
        const {customer} = request;
        return response.json(customer);

    });

    //APAGAR CONTA

    app.delete("/account", VerifyIfAccountExistsCPF, (request,response)=>{
        const {customer } = request;
        //splice
        customers.splice(customers,1);
        return response.status(200).json(customers);
    })

    //BALANCE (SALDO)

    app.get("/balance", VerifyIfAccountExistsCPF,(request, response)=>{
        const {customer} = request;

        const balance = getBalance(customer.statement);
        return response.json(balance);


    });



app.listen(3333);