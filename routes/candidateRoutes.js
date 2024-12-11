import express from 'express';
import checkAuth from '../middlewares/authMiddleware.js';
import Candidate from '../models/candidate.js';
import Subject from '../models/subject.js';
import { safeHandler } from '../middlewares/safeHandler.js';
import ApiError from '../utils/errorClass.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import { verifyToken } from '../utils/jwtFuncs.js';
import { candidateRegistrationSchema, candidateUpdateSchema, interviewDetailsSchema } from '../utils/zodSchemas.js';
import path from 'path';
import config from '../config/config.js';
import getSelectedFields from '../utils/selectFields.js';
import { calculateAllExpertsScoresMultipleSubjects, calculateAverageScoresAllExperts, calculateSingleCandidateScoreSingleSubject } from '../utils/updateScores.js';
import Expert from '../models/expert.js';
import { isValidObjectId } from 'mongoose';
import axios from 'axios';
const tempResumeFolder = config.paths.resume.temporary;
const candidateResumeFolder = config.paths.resume.candidate;

import { fileURLToPath } from 'url';
import { candidateImageUpload } from '../utils/multer.js';
import Feedback from '../models/feedback.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = express.Router();
// the rout / is being used to do crud of an candidate by admin or someone of  higher level
router.route('/')
    .get(checkAuth("admin"), safeHandler(async (req, res) => {
        const candidates = await Candidate.find().select("-password");
        if (!candidates || candidates.length === 0) {
            throw new ApiError(404, "No candidate was found", "NO_CANDIDATES_FOUND");
        }
        return res.success(200, "All candidates successfully retrieved", { candidates });
    }))

    .post(candidateImageUpload.single('image'), safeHandler(async (req, res) => {
        const fields = candidateRegistrationSchema.parse(req.body);
        // { name, email, password, mobileNo, dateOfBirth, education, skills, experience, linkedin, resumeToken, gender }

        if (!isValidObjectId(fields.subject)) throw new ApiError(400, "Invalid subject ID", "INVALID_ID");
        const subject = await Subject.findById(fields.subject);
        if (!subject) {
            throw new ApiError(404, "Subject not found", "SUBJECT_NOT_FOUND");
        }
        subject.candidates.push({ id: fields._id, relevancyScore: 0 });

        const findArray = [
            { email: fields.email },
            { mobileNo: fields.mobileNo }
        ];
        const candidateExists = await Candidate.findOne({
            $or: findArray
        });

        if (candidateExists) {
            let existingField;

            if (candidateExists.email === fields.email) existingField = 'Email';
            else if (candidateExists.mobileNo === fields.mobileNo) existingField = 'Mobile number';

            throw new ApiError(400, `Candidate already exists with this ${existingField}`, "CANDIDATE_ALREADY_EXISTS");
        }
        let newResumeName = null;

        if (fields.resumeToken) {
            try {
                const payload = verifyToken(fields.resumeToken);
                const resumeName = payload.resumeName;

                newResumeName = `${fields.name.split(' ')[0]}_resume_${new Date().getTime()}.pdf`;

                try {
                    axios.post(`${process.env.RESUME_UPLOAD_URL}/upload/resume/changename`, { newResumeName, oldResumeName: resumeName, person: "candidate" })
                } catch (error) {
                    console.log("Error while sending resume token to other server", error)
                }
                fields.resume = newResumeName;

                delete fields.resumeToken; // try removing this if any error occurs
            } catch (error) {
                console.log("Error processing resume during registration", error);
            }
        }
        // uploading image here
        if (req.file) {
            const formData = new FormData();

            fields.image = `${fields.name.split(' ')[0]}_image_${new Date().getTime()}${path.extname(req.file.originalname)}`;

            const destinationFolder = path.join(__dirname, `../public/${config.paths.image.candidate}`);
            const newFilePath = path.join(destinationFolder, fields.image);
            await fs.promises.rename(req.file.path, newFilePath);

            formData.append("image", fs.createReadStream(newFilePath));

            await axios.post(`${process.env.RESUME_UPLOAD_URL}/upload/image/candidate`, formData,
                {
                    headers: {
                        ...formData.getHeaders()
                    }
                }
            )
            fs.promises.unlink(newFilePath);
        }

        fields.password = await bcrypt.hash(fields.password, 10);
        const candidate = await Candidate.create(fields);

        res.success(201, "candidate successfully created", { candidate: { id: candidate._id, email: candidate.email, name: candidate.name } });
        await subject.save();
        calculateSingleCandidateScoreSingleSubject(subject._id, candidate._id);
    }))

    .delete(checkAuth("admin"), safeHandler(async (req, res) => {
        const candidates = await Candidate.find().select("-password");
        if (!candidates || candidates.length === 0) {
            throw new ApiError(404, "No candidates found", "NO_CANDIDATES_FOUND");
        }

        await Candidate.deleteMany();
        console.log("Deleting all candidates", candidates)
        await Promise.all([
            Subject.updateMany({}, { $set: { candidates: [] } }),
            (async () => {
                const folderPath = path.join(__dirname, `../public/${candidateResumeFolder}`);
                try {
                    // await fs.promises.access(folderPath);
                    // await fs.promises.rmdir(folderPath, { recursive: true });

                    // Send a request to the other server to delete all the files in the folder
                } catch (error) {
                    console.error(`Failed to remove directory: ${folderPath}`, error);
                }
            })(),
            Expert.updateMany({}, { $set: { candidates: [] } })
        ]);
        res.success(200, "All candidates successfully deleted", { candidates });

        await calculateAllExpertsScoresMultipleSubjects(candidates.map(c => c.subjects).flat());
        await calculateAverageScoresAllExperts();

    }));

router.route('/:id')
    .get(checkAuth("candidate"), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, "Invalid candidate ID", "INVALID_ID");
        const { education, experience } = req.query;

        const candidate = await Candidate.findById(id).select(getSelectedFields({ education, experience }));

        if (!candidate) {
            throw new ApiError(404, "Candidate not found", "CANDIDATE_NOT_FOUND");
        }
        return res.success(200, "Candidate found", { candidate });
    }))

    .patch(checkAuth("candidate"), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, "Invalid candidate ID", "INVALID_ID");

        const updates = candidateUpdateSchema.parse(req.body);

        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, value]) => value != null)
        );

        if (Object.keys(filteredUpdates).length === 0) {
            throw new ApiError(400, 'No updates provided', 'NO_UPDATES_PROVIDED');
        }

        const uniqueCheck = [];
        if (filteredUpdates.email) uniqueCheck.push({ email: filteredUpdates.email });
        if (filteredUpdates.mobileNo) uniqueCheck.push({ mobileNo: filteredUpdates.mobileNo });
        if (filteredUpdates.linkedin) uniqueCheck.push({ linkedin: filteredUpdates.linkedin });

        if (uniqueCheck.length > 0) {
            const candidateExists = await Candidate.findOne({
                $or: uniqueCheck
            });

            if (candidateExists && candidateExists._id.toString() !== id) {
                let existingField;

                if (candidateExists.email === filteredUpdates.email) existingField = 'Email';
                else if (candidateExists.mobileNo === filteredUpdates.mobileNo) existingField = 'Mobile number';
                else if (candidateExists.linkedIn && candidateExists.linkedin === filteredUpdates.linkedin) existingField = 'Linkedin id';

                throw new ApiError(400, `Candidate already exists with this ${existingField}`, "CANDIDATE_ALREADY_EXISTS");
            }
        }

        if (filteredUpdates.resumeToken) {
            try {
                const payload = verifyToken(filteredUpdates.resumeToken);
                const resumeName = payload.resumeName;
                const resumePath = path.join(__dirname, `../public/${tempResumeFolder}/${resumeName}`);

                const fileExists = await fs.promises.access(resumePath).then(() => true).catch(() => false);

                if (fileExists) {
                    const candidate = await Candidate.findById(id);
                    if (candidate?.resume) {
                        try {
                            await fs.promises.unlink(path.join(__dirname, `../public/${candidateResumeFolder}/${candidate.resume}`));
                        } catch (error) {
                            if (error.code === 'ENOENT') {
                                console.log('File does not exist');
                            } else {
                                console.error('An error occurred:', error);
                            }
                        }
                    }

                    const newResumeName = `${candidate.name.split(' ')[0]}_resume_${new Date().getTime()}.pdf`;
                    const destinationFolder = path.join(__dirname, `../public/${candidateResumeFolder}`);
                    const newFilePath = path.join(destinationFolder, newResumeName);
                    await fs.promises.mkdir(destinationFolder, { recursive: true });
                    await fs.promises.rename(resumePath, newFilePath);

                    filteredUpdates.resume = newResumeName;
                }
            } catch (error) {
                console.log("Error processing resume during update", error);
            }

            delete filteredUpdates.resumeToken;
        }

        if (filteredUpdates.password) {
            filteredUpdates.password = await bcrypt.hash(filteredUpdates.password, 10);
        }

        const candidate = await Candidate.findByIdAndUpdate(
            id,
            filteredUpdates,
            {
                new: true,
                runValidators: true
            }
        ).select("-password");

        if (!candidate) {
            throw new ApiError(404, "Candidate not found", "CANDIDATE_NOT_FOUND");
        }

        res.success(200, "Candidate updated successfully", { candidate });

        if (filteredUpdates.skills) {
            await Promise.all([calculateSingleCandidateScoreSingleSubject(candidate._id), calculateAllExpertsScoresMultipleSubjects(candidate.subjects)]);
            await Promise.all([calculateAverageScoresAllExperts()]);
        }
    }))

    .delete(checkAuth("admin"), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, "Invalid candidate ID", "INVALID_ID");

        const candidate = await Candidate.findByIdAndDelete(id).select("-password");
        if (!candidate) {
            throw new ApiError(404, "Candidate not found", "CANDIDATE_NOT_FOUND");
        }
        try {
            await Promise.all([
                Subject.updateMany({ _id: { $in: candidate.subjects } }, { $pull: { candidates: { id: candidate._id } } }),
                (async () => {
                    const filePath = path.join(__dirname, `../public/${candidateResumeFolder}/${candidate.resume}`);
                    try {
                        // await fs.promises.access(filePath, fs.constants.F_OK);
                        // await fs.promises.unlink(filePath);

                        // Send a request to the other server to delete the file
                    } catch (error) {
                        if (error.code !== 'ENOENT') {
                            console.error(`Failed to delete file: ${filePath}`, error);
                        }
                    }
                })()
            ]);
        } catch (error) {
            console.error('Error occurred while deleting candidate', error);
        }

        res.success(200, "Candidate deleted successfully", { candidate });
        await calculateAllExpertsScoresMultipleSubjects(candidate.subjects);
        await calculateAverageScoresAllExperts();

    }));







router.route('/:id/interviewdetails')

    .get(checkAuth('candidate'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid candidate id', 'INVALID_ID');

        const candidate = await Candidate.findById(id);
        if (!candidate) {
            throw new ApiError(404, 'Candidate not found', 'CANDIDATE_NOT_FOUND');
        }

        return res.success(200, "Interview details fetched successfully", { interviewDetails: candidate.interviewDetails });
    }))

    .patch(checkAuth('expert'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid candidate id', 'INVALID_ID');

        const updates = interviewDetailsSchema.parse(req.body);

        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, value]) => value != null)
        );

        const fieldUpdates = {};
        for (const [key, value] of Object.entries(filteredUpdates)) {
            fieldUpdates[`interviewDetails.${key}`] = value;
        }

        const candidate = await Candidate.findByIdAndUpdate(
            id,
            {
                $set: fieldUpdates
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!candidate) {
            throw new ApiError(404, 'Candidate not found', 'CANDIDATE_NOT_FOUND');
        }

        return res.success(200, "Interview details updated successfully", { interviewDetails: candidate.interviewDetails });
    }));







router.route('/:id/panel')
    .get(checkAuth('admin'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid candidate id', 'INVALID_ID');

        const candidate = await Candidate.findById(id).populate('panel.expert panel.feedback');
        if (!candidate) {
            throw new ApiError(404, 'Candidate not found', 'CANDIDATE_NOT_FOUND');
        }

        return res.success(200, "Panel fetched successfully", { panel: candidate.panel });
    }))

    .post(checkAuth('admin'), safeHandler(async (req, res) => {
        const { id } = req.params;
        const { expertId } = req.body;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid candidate id', 'INVALID_ID');
        if (!isValidObjectId(expertId)) throw new ApiError(400, 'Invalid expert id', 'INVALID_ID');

        const candidate = await Candidate.findById(id);
        if (!candidate) {
            throw new ApiError(404, 'Candidate not found', 'CANDIDATE_NOT_FOUND');
        }

        const alreadyAdded = candidate.panel.some(panel => panel.expert.equals(expertId));
        if (alreadyAdded) {
            throw new ApiError(400, 'Expert already added', 'EXPERT_ALREADY_ADDED');
        }

        const expert = await Expert.findById(expertId);
        if (!expert) {
            throw new ApiError(404, 'Expert not found', 'EXPERT_NOT_FOUND');
        }

        candidate.panel.push({ expert: expertId, feedback: null });
        expert.candidates.push(id);
        await Promise.all([candidate.save(), expert.save()]);

        return res.success(201, "Panel member added successfully", { panel: candidate.panel });
    }))

    .delete(checkAuth('admin'), safeHandler(async (req, res) => {
        const { id } = req.params;
        const { expertId } = req.body;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid candidate id', 'INVALID_ID');
        if (!isValidObjectId(expertId)) throw new ApiError(400, 'Invalid expert id', 'INVALID_ID');

        const candidate = await Candidate.findById(id);
        if (!candidate) {
            throw new ApiError(404, 'Candidate not found', 'CANDIDATE_NOT_FOUND');
        }

        const expert = await Expert.findById(expertId);
        if (!expert) {
            throw new ApiError(404, 'Expert not found', 'EXPERT_NOT_FOUND');
        }

        candidate.panel = candidate.panel.filter(panel => !panel.expert.equals(expertId));
        expert.candidates = expert.candidates.filter(appId => !appId.equals(id));
        await Promise.all([candidate.save(), expert.save()]);

        return res.success(200, "Panel member removed successfully", { panel: candidate.panel });
    }));












router.route('/:id/panel/:expertId')
    .get(checkAuth('admin'), safeHandler(async (req, res) => { // sorry that I am fetching all the expert Data uneccessarily But I dont have time to optimize it rn
        const { id, expertId } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid candidate id', 'INVALID_ID');
        if (!isValidObjectId(expertId)) throw new ApiError(400, 'Invalid expert id', 'INVALID_ID');

        const candidate = await Candidate.findById(id).populate('panel.expert panel.feedback');
        if (!candidate) {
            throw new ApiError(404, 'Candidate not found', 'CANDIDATE_NOT_FOUND');
        }

        const panelMember = candidate.panel.find(panel => panel.expert.equals(expertId));
        if (!panelMember) {
            throw new ApiError(404, 'Panel member not found', 'EXPERT_NOT_FOUND');
        }

        return res.success(200, "Panel member fetched successfully", { panelMember });
    }))

    .patch(checkAuth('candidate'), safeHandler(async (req, res) => {
        const { id, expertId } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid candidate id', 'INVALID_ID');
        if (!isValidObjectId(expertId)) throw new ApiError(400, 'Invalid expert id', 'INVALID_ID');

        const { feedback } = req.body; // { score, content }
        if (!feedback || !feedback.score || !feedback.content) {
            throw new ApiError(400, 'Feedback not provided', 'FEEDBACK_NOT_PROVIDED');
        }

        feedback.score = parseInt(feedback.score);

        const candidate = await Candidate.findById(id);
        if (!candidate) {
            throw new ApiError(404, 'Candidate not found', 'CANDIDATE_NOT_FOUND');
        }

        const panelMember = candidate.panel.find(panel => panel.expert.equals(expertId));
        if (!panelMember) {
            throw new ApiError(404, 'Panel member not found', 'EXPERT_NOT_FOUND');
        };

        const expert = await Expert.findById(expertId);
        if (!expert) {
            throw new ApiError(404, 'Expert not found', 'EXPERT_NOT_FOUND');
        }
        const subject = await Subject.findById(candidate.subject);
        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }

        if (panelMember.feedback) {
            const oldFeedback = await Feedback.findById(panelMember.feedback);
            if (!oldFeedback) {
                throw new ApiError(404, 'Feedback not found', 'FEEDBACK_NOT_FOUND');
            }
            oldFeedback.score = feedback.score;
            oldFeedback.content = feedback.content;
            await oldFeedback.save();
        }
        else {
            const newFeedback = await Feedback.create({
                expert: expertId,
                subject: candidate.subject,
                score: feedback.score,
                content: feedback.content,
                candidate: id
            });

            panelMember.feedback = newFeedback._id;
            expert.feedbacks.push(newFeedback._id);
            subject.feedbacks.push(newFeedback._id);
            candidate.feedbacks.push(newFeedback._id);
            await Promise.all[expert.save(), subject.save(), candidate.save()];
        }

        return res.success(200, "Feedback added/updated successfully", { panel: application.panel });
    }))

    .delete(checkAuth('candidate'), safeHandler(async (req, res) => {
        const { id, expertId } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid candidate id', 'INVALID_ID');
        if (!isValidObjectId(expertId)) throw new ApiError(400, 'Invalid expert id', 'INVALID_ID');

        const candidate = await Candidate.findById(id);
        if (!candidate) {
            throw new ApiError(404, 'Candidate not found', 'CANDIDATE_NOT_FOUND');
        }

        const panelMember = candidate.panel.find(panel => panel.expert.equals(expertId));
        if (!panelMember) {
            throw new ApiError(404, 'Panel member not found', 'EXPERT_NOT_FOUND');
        }

        if (!panelMember.feedback) {
            throw new ApiError(404, 'Feedback not found', 'FEEDBACK_NOT_FOUND');
        }

        const expert = await Expert.findById(expertId);
        if (!expert) {
            throw new ApiError(404, 'Expert not found', 'EXPERT_NOT_FOUND');
        }
        const subject = await Subject.findById(candidate.subject);
        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }

        expert.feedbacks = expert.feedbacks.filter(feedback => !feedback.equals(panelMember.feedback));
        subject.feedbacks = subject.feedbacks.filter(feedback => !feedback.equals(panelMember.feedback));
        candidate.feedbacks = candidate.feedbacks.filter(feedback => !feedback.equals(panelMember.feedback));

        await Feedback.findByIdAndDelete(panelMember.feedback);
        panelMember.feedback = null;
        await Promise.all([expert.save(), subject.save(), candidate.save()]);

        return res.success(200, "Feedback deleted successfully", { panel: candidate.panel });
    }));

router.route('/:id/panel/:expertIdP/note')

    .get(checkAuth('expert'), safeHandler(async (req, res) => {
        const { id, expertIdP } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid candidate id', 'INVALID_ID');
        if (!isValidObjectId(expertIdP)) throw new ApiError(400, 'Invalid expert id', 'INVALID_ID');

        const candidate = await Application.findById(id);
        if (!candidate) {
            throw new ApiError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
        }

        const panelMember = candidate.panel.find(panel => panel.expert.equals(expertIdP));
        if (!panelMember) {
            throw new ApiError(404, 'Panel member not found', 'EXPERT_NOT_FOUND');
        }

        return res.success(200, "Note fetched successfully", { expertNotes: candidate.interviewDetails.expertNotes });
    }))
    .patch(checkAuth('expert'), safeHandler(async (req, res) => {
        const { id, expertIdP } = req.params;
        let expertId;

        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid candidate id', 'INVALID_ID');

        if (req.user.id && isValidObjectId(req.user.id)) {
            if (expertIdP && expertIdP !== req.user.id) throw new ApiError(403, 'Unauthorized', 'UNAUTHORIZED');
            expertId = req.user.id;
        }
        else if (!isValidObjectId(expertIdP)) throw new ApiError(400, 'Invalid expert id', 'INVALID_ID');
        else expertId = expertIdP;

        const { note } = req.body;

        const candidate = await Application.findById(id);
        if (!candidate) {
            throw new ApiError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
        }

        const panelMember = candidate.panel.find(panel => panel.expert.equals(expertId));
        if (!panelMember) {
            throw new ApiError(404, 'Panel member not found', 'EXPERT_NOT_FOUND');
        }

        candidate.interviewDetails.expertNotes.push({
            expert: expertId,
            note
        });
        await candidate.save();

        return res.success(200, "Note added successfully", { expertNotes: candidate.interviewDetails.expertNotes });

    }));














export default router;