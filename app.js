const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3000;

mongoose.connect('mongodb://127.0.0.1:27017/calculatorDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

const responseSchema = new mongoose.Schema({
    question: String,
    answer: Number,
    timestamp: { type: Date, default: Date.now }
});

const Response = mongoose.model('Response', responseSchema);

app.get('/:num1/:operation/:num2/:operation2?/:num3?', async (req, res) => {
    const num1 = parseFloat(req.params.num1);
    const num2 = parseFloat(req.params.num2);
    const operation = req.params.operation;
    const num3 = parseFloat(req.params.num3);
    const operation2 = req.params.operation2;

    if (isNaN(num1) || isNaN(num2) || (num3 && isNaN(num3))) {
        res.status(400).json({ error: 'Invalid numbers provided' });
        return;
    }

    let answer;
    let question = `${num1} ${getSymbol(operation)} ${num2}`;

    switch (operation) {
        case 'plus':
            answer = num1 + num2;
            break;
        case 'minus':
            answer = num1 - num2;
            break;
        case 'into':
            answer = num1 * num2;
            break;
        case 'divide':
            answer = num1 / num2;
            break;
        default:
            res.status(400).json({ error: 'Invalid operation' });
            return;
    }

    if (num3 && operation2) {
        switch (operation2) {
            case 'plus':
                answer += num3;
                question = `${question} ${getSymbol(operation2)} ${num3}`;
                break;
            case 'minus':
                answer -= num3;
                question = `${question} ${getSymbol(operation2)} ${num3}`;
                break;
            case 'into':
                answer *= num3;
                question = `${question} ${getSymbol(operation2)} ${num3}`;
                break;
            case 'divide':
                answer /= num3;
                question = `${question} ${getSymbol(operation2)} ${num3}`;
                break;
            default:
                res.status(400).json({ error: 'Invalid operation' });
                return;
        }
    }

    const responseJSON = {
        question: question,
        answer: answer,
    };

    const newResponse = new Response({
        question: question,
        answer: answer,
    });

    try {
        await newResponse.save();
        console.log('Response saved to the database');
    } catch (error) {
        console.error('Error saving response:', error);
    }

    res.json(responseJSON);
});

function getSymbol(operation) {
    switch (operation) {
        case 'plus':
            return '+';
        case 'minus':
            return '-';
        case 'into':
            return '*';
        case 'divide':
            return '/';
        default:
            return operation;
    }
}

app.get('/history', async (req, res) => {
    try {
        const responses = await Response.find({})
            .sort({ timestamp: -1 })
            .limit(20)
            .select('question answer');

            const htmlUI = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Operations</title>
            </head>
            <body>
                <h1>List of latest 20 operations happened</h1>
                <ol>
                    ${responses.map(response => `<li>${response.question} = ${response.answer}</li>`).join('')}
                </ol>
            </body>
            </html>
        `;

        res.setHeader('Content-Type', 'text/html');

        res.send(htmlUI);
    } catch (error) {
        console.error('Error fetching responses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/', async (req, res) => {
    try {
        const responses = await Response.find({}).select('question answer');

        const htmlUI = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Operations</title>
            </head>
            <body>
                <h1>List of operations happened</h1>
                <ol>
                    ${responses.map(response => `<li>${response.question} = ${response.answer}</li>`).join('')}
                </ol>
            </body>
            </html>
        `;

        res.setHeader('Content-Type', 'text/html');

        res.send(htmlUI);
    } catch (error) {
        console.error('Error fetching and rendering HTML UI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});