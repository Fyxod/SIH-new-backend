import express from 'express';
import connectMongo from './config/db.js';
import config from './config/config.js';
import responseHandler from './middlewares/responseHandler.js';
import cors from 'cors';
import path from 'path';
//routes
import adminRoutes from './routes/adminRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import expertRoutes from './routes/expertRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import extraRoutes from './routes/extraRoutes.js';
import sendErrorMail from './utils/sendErrorMail.js';
const app = express();
const __dirname = path.resolve();

connectMongo();
//checkout populate or whatevr

app.use((req, res, next) => {
    console.log(req.url, req.method);
    next();
})

app.use(cors({
    origin: (origin, callback) => {
        callback(null, origin || '*'); // Allow all origins
    },
    credentials: true, // Allow cookies to be sent
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseHandler);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.send('<h1>SIH 2024</h1>');
});

app.use('/admin', adminRoutes);
app.use('/candidate', candidateRoutes);
app.use('/expert', expertRoutes);
app.use('/subject', subjectRoutes);
app.use('/', extraRoutes);


//TEST OUT THIS ERROR JARGON FIRST
app.use((error, req, res, next) => {
    console.log(error); // temp log
    if (error.errors && error.errors[0].message) {
        return res.error(400, error.errors[0].message, 'VALIDATION_ERROR');
    }

    if (error.isOperational) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal Server Error';
        return res.error(statusCode, message, error.errorCode, error.data);
    } else {
        sendErrorMail(error);
        //log in a special way maybe
        console.error("ALERT ALERT ALERT");
        console.error('Unhandled error:', error);
        return res.error(500, 'Internal Server Error', 'UNHANDLED_ERROR');
    }
});

app.listen(config.server.port, () => {
    console.log(`Server is running on port ${config.server.port}`);
});

/*
things to remember:
1. An application is linked with an expert only when the expert is added to the panel

things pending:
2. Format all routes
3. Seperate into controllers
5. Add more PATCH routes
10. Add enums for different drdo centres
12. yet to add delete route for /subject/:id/candidate/ - when a candidate is removed from a subject or when a candidate unapplies for a subject - so the same in application routes in application/:id DELETE - same for expert
14. Unhandled error or slow server? checkout fs.existsSync in All candidates delete
15. Add a route to get all applications for a subject
16. Add a route to get all applications for a candidate
17. Add a route to get all applications for an expert
18. Do that encrypted pdf mail to expert thingy with password
21. Remove all subjects from the queries while returning responses
22. Candidate routes and application routes pending to be polluted by calculateAverageScores = also have to add calculcateAverageRelenvancyScores and calculateAverageFeedbackScore
23. CDN and domain left to be setup
24. Review pending applcation routes
25. delete images when deleting candidate or expert

Also update expert's score on candidate addition or removal

/*
Problem Statement Title:
Determining expert relevance with respect to interview board subject and candidates’ area of expertise

Description:
Background: Recruitment and Assessment Centre (RAC) under DRDO, Ministry of Defence conducts interview for recommending candidates
under recruitment, assessment and for sponsorship to acquire higher qualification. Description: The process of conducting 
an interview comprises of selection of board members i.e. experts from DRDO, industry, academia, etc. It is a challenge to
manually match profile of subject experts w.r.t. interview board subject and candidates’ area of expertise.

Expected Solution: 
The solution shall be able to provide a matching score for experts whose domain matches w.r.t. interview board subject and candidates 
area of expertise and thereafter should be able to predict suitability of expert for a particular interview board through a relevancy 
score. To arrive on the relevancy score for an expert the system should be able to determine a profile score for each selected expert 
w.r.t. profile of candidates to be interviewed.

Organization: Ministry of Defence
Department: Defence Research and Devlopment Organisation (DRDO)
Category: Software
Theme: Smart Automation
*/