import Subject from "../models/subject.js";
import Expert from "../models/expert.js";
import Candidate from "../models/candidate.js";
import dotenv from "dotenv";
import axios from "axios";
import sendErrorMail from "./sendErrorMail.js";

const { API_URL } = process.env;
dotenv.config();
// I am not returning when there are no candidates found in any function. In that case, there should be some relevancy score but the profile score should be 0
// The Api calls can be separated into two different functions for better readability but I don't want to risk messing with the logic

export async function calculateSingleExpertScoresSingleSubject(subjectId, expertId) { // Calculate the scores of a single expert for a single subject ---> when a new expert is added to a subject
    console.log("inside calculateSingleExpertScoresSingleSubject");
    const [subject, expert] = await Promise.all([Subject.findById(subjectId).populate('candidates.id'), Expert.findById(expertId)]);
    if (!subject) {
        console.log(`Subject not found for id ${subjectId} in calculateSingleExpertScoresSingleSubject`);
        return;
    }
    if (!expert) {
        console.log(`Expert not found for ${expertId} in calculateSingleExpertScoresSingleSubject`);
        return;
    }
    const candidates = subject.candidates;
    const candidateData = candidates.map(candidate => ({
        name: candidate.name,
        skills: candidate.skills.map(skill => skill.name)
    }));

    const expertData = {
        name: expert.id.name,
        skills: expert.skills.map(skill => skill.name)
    };
    const subjectData = {
        title: subject.title,
        recommendedSkills: subject.recommendedSkills
    };

    let profileScore, relevancyScore;
    try {
        // const response = await axios.post(`${API_URL}/matching/short`, { candidateData, expertData, subjectData });
        const response = { data: { profileScore: (Math.floor(Math.random() * 10) + 1), relevancyScore: (Math.floor(Math.random() * 10) + 1) } }; // Dummy data
        const { data } = response;
        profileScore = data.profileScore;
        relevancyScore = data.relevancyScore;
    } catch (error) {
        console.error(`Error calculating scores for expert ${expertId}:`, error);
        sendErrorMail(error);
    }
    subject.experts.forEach(expert => {
        if (expert.id._id.equals(expertId)) {
            expert.profileScore = profileScore || expert.profileScore;
            expert.relevancyScore = relevancyScore || expert.relevancyScore;
        }
    });
    await subject.save();
}

export async function calculateSingleExpertScoresMultipleSubjects(expertId) { // Calculate the scores of a single expert across multiple subjects ---> when the expert's skills are updated
    console.log("inside calculateSingleExpertScoresMultipleSubjects");
    const expert = await Expert.findById(expertId).populate({
        path: 'subjects',
        populate: {
            path: 'candidates.id',
        },
    });

    if (!expert) {
        console.log(`Expert not found for id ${expertId} in calculateSingleExpertScoresMultipleSubjects`);
        return;
    }
    const subjects = expert.subjects;
    if (!subjects || subjects.length === 0) {
        console.log(`No subjects found for expert ${expertId} in calculateSingleExpertScoresMultipleSubjects`);
        return;
    }
    const expertData = {
        name: expert.name,
        skills: expert.skills.map(skill => skill.name)
    };

    const scorePromises = subjects.map(async subject => {

        const candidates = subject.candidates;
        const candidateData = candidates.map(candidate => ({
            name: candidate.name,
            skills: candidate.skills.map(skill => skill.name)
        }));

        const subjectData = {
            title: subject.title,
            recommendedSkills: subject.recommendedSkills
        };
        let profileScore, relevancyScore;
        try {
            // const response = await axios.post(`${API_URL}/matching/short`, { candidateData, expertData, subjectData });
            const response = { data: { profileScore: (Math.floor(Math.random() * 10) + 1), relevancyScore: (Math.floor(Math.random() * 10) + 1) } }; // Dummy data
            const { data } = response;
            profileScore = data.profileScore;
            relevancyScore = data.relevancyScore;
        } catch (error) {
            console.error(`Error calculating scores for expert ${expertId}:`, error);
            sendErrorMail(error);
        }
        subject.experts.forEach(expert => {
            if (expert.id.equals(expertId)) {
                expert.profileScore = profileScore || expert.profileScore;
                expert.relevancyScore = relevancyScore || expert.relevancyScore;
            }
        });
        await subject.save();
    });
    await Promise.all(scorePromises);
}

export async function calculateAllExpertScoresSingleSubject(subjectId) { // Calculate the scores of all experts for a single subject ---> when the recommended skills of a subject are updated ||  when a new candidate applies for a subject || when a candidate is removed from a subject
    console.log("inside calculateAllExpertScoresSingleSubject");
    const subject = await Subject.findById(subjectId).populate('experts.id candidates.id');
    if (!subject) {
        console.log(`Subject not found for id ${subjectId} in calculateAllExpertScoresSingleSubject`);
        return;
    }

    const candidates = subject.candidates;
    const candidateData = candidates.map(candidate => ({
        name: candidate.name,
        skills: candidate.skills.map(skill => skill.name),
    }));

    const experts = subject.experts;
    if (!experts || experts.length === 0) {
        console.log(`No experts found for subject ${subjectId} in calculateAllExpertScoresSingleSubject`);
        return;
    }
    const subjectData = {
        title: subject.title,
        recommendedSkills: subject.recommendedSkills,
    };

    const scorePromises = experts.map(async expert => {
        const expertData = {
            name: expert.id.name,
            skills: expert.id.skills.map(skill => skill.name),
        };

        try {
            // const response = await axios.post(`${API_URL}/matching/short`, { candidateData, expertData, subjectData });
            const response = { data: { profileScore: (Math.floor(Math.random() * 10) + 1), relevancyScore: (Math.floor(Math.random() * 10) + 1) } }; // Dummy data
            const { profileScore, relevancyScore } = response.data;
            return { expertId: expert.id._id, profileScore, relevancyScore };
        } catch (error) {
            console.error(`Error calculating scores for expert ${expert.id?._id}:`, error);
            sendErrorMail(error);
            return { expertId: expert.id?._id, profileScore: expert.profileScore, relevancyScore: expert.relevancyScore };
        }
    });

    const results = await Promise.all(scorePromises);

    results.forEach(({ expertId, profileScore, relevancyScore }) => {
        const expert = experts.find(exp => exp.id._id.equals(expertId));
        if (expert) {
            expert.profileScore = profileScore || expert.profileScore;
            expert.relevancyScore = relevancyScore || expert.relevancyScore;
        }
    });

    await subject.save();
}

export async function calculateAllExpertsScoresMultipleSubjects(subjectIds) { // Calculate the scores of all experts across multiple subjects ---> when the skills of a candidate are updated || when a candidate(s) is deleted from the system
    console.log("inside calculateAllExpertsScoresMultipleSubjects");
    let subjects;
    if (subjectIds && subjectIds.length != 0) {
        subjects = await Subject.find({ _id: { $in: subjectIds } }).populate('experts.id candidates.id');
    }
    else {
        subjects = await Subject.find().populate('experts.id candidates.id');
    }

    if (!subjects || subjects.length === 0) {
        console.log("No subjects found for the subjectIds in calculateAllExpertsScoresMultipleSubjects");
        return;
    }

    const subjectPromises = subjects.map(async subject => {
        const candidates = subject.candidates
        const candidateData = candidates.map(candidate => ({
            name: candidate.name,
            skills: candidate.skills.map(skill => skill.name),
        }));

        const experts = subject.experts;
        if (!experts || experts.length === 0) {
            console.log(`No experts found for subject id ${subject._id} in calculateAllExpertsScoresMultipleSubjects`);
            return;
        }
        const subjectData = {
            title: subject.title,
            recommendedSkills: subject.recommendedSkills,
        };

        const scorePromises = experts.map(async expert => {
            const expertData = {
                name: expert.id.name,
                skills: expert.id.skills.map(skill => skill.name),
            };

            try {
                // const response = await axios.post(`${API_URL}/matching/short`, { candidateData, expertData, subjectData });
                // generate random scores for now between 1 and 10
                const response = { data: { profileScore: (Math.floor(Math.random() * 10) + 1), relevancyScore: (Math.floor(Math.random() * 10) + 1)} }; // Dummy data
                const { profileScore, relevancyScore } = response.data;
                return { expertId: expert.id._id, profileScore, relevancyScore };
            } catch (error) {
                console.error(`Error calculating scores for expert ${expert.id?._id}:`, error);
                sendErrorMail(error);
                return { expertId: expert.id?._id, profileScore: expert.profileScore, relevancyScore: expert.relevancyScore };
            }
        });

        const results = await Promise.all(scorePromises);

        results.forEach(({ expertId, profileScore, relevancyScore }) => {
            const expert = experts.find(exp => exp.id._id.equals(expertId));
            if (expert) {
                expert.profileScore = profileScore || expert.profileScore;
                expert.relevancyScore = relevancyScore || expert.relevancyScore;
            }
        });

        try {
            await subject.save();
            console.log(`Scores updated for subject ${subject.title}`); // log kept only for now
        } catch (error) {
            console.error(`Error saving scores for subject ${subject._id}:`, error);
            sendErrorMail(error);
        }
    });

    await Promise.all(subjectPromises);
}

export async function calculateSingleCandidateScoreSingleSubject(subjectId, candidateId) { // Calculate the score of a single candidate for a single subject ---> when a new candidate applies for a subject
    console.log("inside calculateSingleCandidateScoreSingleSubject");
    const [subject, candidate] = await Promise.all([Subject.findById(subjectId), Candidate.findById(candidateId)]);
    if (!subject) {
        console.log(`Subject not found for subject id ${subjectId} in calculateSingleCandidateScoreSingleSubject`);
        return;
    }
    if (!candidate) {
        console.log(`Candidate not found for id ${candidateId} in calculateSingleCandidateScoreSingleSubject`);
        return;
    }

    const subjectData = {
        title: subject.title,
        recommendedSkills: subject.recommendedSkills
    };

    const candidateData = {
        name: candidate.name,
        skills: candidate.skills.map(skill => skill.name)
    };
    let relevancyScore;

    try {
        // const response = await axios.post(`${API_URL}/matching/short`, { candidateData, subjectData });
        const response = { data: { relevancyScore: (Math.floor(Math.random() * 10) + 1) } }; // Dummy data
        const { data } = response;
        relevancyScore = data.relevancyScore;
    } catch (error) {
        console.error(`Error calculating score for candidate ${candidateId}:`, error);
        sendErrorMail(error);
    }

    subject.candidates.forEach(candidate => {
        if (candidate.id === candidateId) {
            candidate.relevancyScore = relevancyScore || candidate.relevancyScore || 0;
        }
    });
    candidate.relevancyScore = relevancyScore || candidate.relevancyScore || 0;

    await Promise.all([subject.save(), candidate.save()]);
}

export async function calculateAllCandidateScoresSingleSubject(subjectId) { // Calculate the scores of all candidates for a single subject ---> when the recommended skills of a subject are updated
    console.log("inside calculateAllCandidateScoresSingleSubject");
    const subject = await Subject.findById(subjectId).populate('candidates.id');
    if (!subject) {
        console.log(`Subject not found for id ${subjectId} in calculateAllCandidateScoresSingleSubject`);
        return;
    }

    const candidates = subject.candidates;
    if (!candidates || candidates.length === 0) {
        console.log(`No candidates found for subject ${subjectId} in calculateAllCandidateScoresSingleSubject`);
        return;
    }

    const subjectData = {
        title: subject.title,
        recommendedSkills: subject.recommendedSkills,
    };

    const scorePromises = candidates.map(async candidate => {
        const candidateData = {
            name: candidate.id.name,
            skills: candidate.id.skills.map(skill => skill.name),
        };

        try {
            // const response = await axios.post('https://some-link-ig/compare', { candidateData, subjectData });
            const response = { data: { relevancyScore: (Math.floor(Math.random() * 10) + 1) } }; // Dummy data
            const { relevancyScore } = response.data;
            return { candidateId: candidate.id._id, relevancyScore };
        } catch (error) {
            console.error(`Error calculating score for candidate ${candidate.id?._id}:`, error);
            sendErrorMail(error);
            return { candidateId: candidate.id._id, relevancyScore: candidate.relevancyScore };
        }
    });

    const results = await Promise.all(scorePromises);

    results.forEach(async ({ candidateId, relevancyScore }) => {
        const candidate = candidates.find(cand => cand.id._id.equals(candidateId));
        if (candidate) {
            candidate.relevancyScore = relevancyScore || candidate.relevancyScore || 0;

            await Candidate.findByIdAndUpdate(
                candidateId,
                { relevancyScore: relevancyScore || candidate.relevancyScore || 0 },
                { new: true });
        }
    });

    await subject.save();
}

export async function calculateAllCandidatesScoresMultipleSubjects(subjectIds) { // Calculate the scores of all candidates across multiple subjects ---> cause why not (might be handy in the future)
    console.log("inside calculateAllCandidatesScoresMultipleSubjects");
    let subjects;
    if (subjectIds && subjectIds.length != 0) {
        subjects = await Subject.find({ _id: { $in: subjectIds } }).populate('candidates.id');
    }
    else {
        subjects = await Subject.find().populate('candidates');
    }

    if (!subjects || subjects.length === 0) {
        console.log("No subjects found for the subjectIds in calculateAllCandidatesScoresMultipleSubjects");
        return;
    }

    const subjectPromises = subjects.map(async subject => {
        const candidates = subject.candidates;

        const subjectData = {
            title: subject.title,
            recommendedSkills: subject.recommendedSkills,
        };

        const scorePromises = candidates.map(async candidate => {
            const candidateData = {
                name: candidate.id.name,
                skills: candidate.id.skills.map(skill => skill.name),
            };

            try {
                // const response = await axios.post('https://some-link-ig/compare', { candidateData, subjectData });
                const response = { data: { relevancyScore: (Math.floor(Math.random() * 10) + 1) } }; // Dummy data
                const { relevancyScore } = response.data;
                return { candidateId: candidate.id._id, relevancyScore };
            } catch (error) {
                console.error(`Error calculating score for candidate ${candidate.id?._id}:`, error);
                sendErrorMail(error);
                return { candidateId: candidate.id._id, relevancyScore: candidate.relevancyScore };
            }
        });

        const results = await Promise.all(scorePromises);

        results.forEach(async ({ candidateId, relevancyScore }) => {
            const candidate = candidates.find(cand => cand.id._id.equals(candidateId));
            if (candidate) {
                candidate.relevancyScore = relevancyScore || candidate.relevancyScore || 0;
            }

            await Candidate.findByIdAndUpdate(
                candidateId,
                { relevancyScore: relevancyScore || candidate.relevancyScore || 0 },
                { new: true }
            );

        });

        try {
            await subject.save();
            console.log(`Scores updated for subject ${subject.title}`); // log kept only for now
        } catch (error) {
            console.error(`Error saving scores for subject ${subject._id}:`, error);
            sendErrorMail(error);
        }
    });

    await Promise.all(subjectPromises);
}

export async function calculateAverageScoresSingleExpert(expertId) {
    const expert = await Expert.findById(expertId).populate('subjects');
    if (!expert) {
        console.log(`Expert not found for id ${expertId} in calculateAverageScores`);
        return;
    }
    const subjects = expert.subjects;
    if (!subjects || subjects.length === 0) {
        console.log(`No subjects found for expert ${expertId} in calculateAverageScores`);
        return;
    }
    let totalProfileScore = 0;
    let totalRelevancyScore = 0;
    subjects.forEach(subject => {
        const expertData = subject.experts.find(exp => exp.id.equals(expertId));
        totalProfileScore += expertData.profileScore;
        totalRelevancyScore += expertData.relevancyScore;
    });
    const averageProfileScore = totalProfileScore / subjects.length;
    const averageRelevancyScore = totalRelevancyScore / subjects.length;
    expert.averageProfileScore = averageProfileScore;
    expert.averageRelevancyScore = averageRelevancyScore;
    await expert.save();
}

export async function calculateAverageScoresAllExperts() {
    const experts = await Expert.find().populate('subjects');
    if (!experts || experts.length === 0) {
        console.log("No experts found in calculateAverageScoresAllExperts");
        return;
    }
    const expertPromises = experts.map(async expert => {
        const subjects = expert.subjects;
        if (!subjects || subjects.length === 0) {
            console.log(`No subjects found for expert ${expert._id} in calculateAverageScoresAllExperts`);
            return;
        }
        let totalProfileScore = 0;
        let totalRelevancyScore = 0;
        subjects.forEach(subject => {
            const expertData = subject.experts.find(exp => exp.id.equals(expert._id));
            totalProfileScore += expertData.profileScore;
            totalRelevancyScore += expertData.relevancyScore;
        });
        const averageProfileScore = totalProfileScore / subjects.length;
        const averageRelevancyScore = totalRelevancyScore / subjects.length;
        expert.averageProfileScore = averageProfileScore;
        expert.averageRelevancyScore = averageRelevancyScore;
        await expert.save();
    });
    await Promise.all(expertPromises);
}

// calculate average feedback score for expert

// export async function calculateAverageFeedbackScoreAllExperts(){
//     const experts = await Expert.find().populate('subjects');
//     if(!experts || experts.length === 0){
//         console.log("No experts found in calculateAverageFeedbackScoreAllExperts");
//         return;
//     }
//     const expertPromises = experts.map(async expert => {
//         const subjects = expert.subjects;
//         if(!subjects || subjects.length === 0){
//             console.log(`No subjects found for expert ${expert._id} in calculateAverageFeedbackScoreAllExperts`);
//             return;
//         }
//         let totalFeedbackScore = 0;
//         let totalFeedbackCount = 0;
//         subjects.forEach(subject => {
//             const expertData = subject.experts.find(exp => exp.id.equals(expert._id));
//             if(expertData.feedback){
//                 totalFeedbackScore += expertData.feedback.score;
//                 totalFeedbackCount++;
//             }
//         });
//         const averageFeedbackScore = totalFeedbackScore / totalFeedbackCount;
//         expert.averageFeedbackScore = averageFeedbackScore;
//         await expert.save();
//     });
//     await Promise.all(expertPromises);
// }