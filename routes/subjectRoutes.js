import express from 'express';
import checkAuth from '../middlewares/authMiddleware.js';
import { safeHandler } from '../middlewares/safeHandler.js';
import ApiError from '../utils/errorClass.js';
import Subject from '../models/subject.js';
import { subjectRegistrationSchema, subjectUpdateSchema } from '../utils/zodSchemas.js';
import config from '../config/config.js';
import Candidate from '../models/candidate.js';
import { isValidObjectId } from 'mongoose';
import Expert from '../models/expert.js';
import getSelectedFields from '../utils/selectFields.js';
import { calculateAllCandidateScoresSingleSubject, calculateAllExpertScoresSingleSubject, calculateAverageScoresAllExperts, calculateAverageScoresSingleExpert, calculateSingleCandidateScoreSingleSubject, calculateSingleExpertScoresSingleSubject } from '../utils/updateScores.js';

const router = express.Router();

router.route('/')
    .get(checkAuth('candidate'), safeHandler(async (req, res) => {
        const subjects = await Subject.find();

        if (!subjects || subjects.length === 0) {
            throw new ApiError(404, 'No subjects found', 'NO_SUBJECTS_FOUND');
        }
        return res.success(200, 'All subjects successfully retrieved', { subjects });
    }))

    .post(checkAuth('admin'), safeHandler(async (req, res) => {
        const fields = subjectRegistrationSchema.parse(req.body);
        // { title, description, department, type, location, locationType, recommendedSkills, duration }
        const experts = await Expert.find();
        const subject = await Subject.create({
            ...fields,
            status: 'open',
            candidates: [],
            experts: experts.map(expert => ({ id: expert.id, profileScore: 0, relevancyScore: 0 })) || [],
        });
        res.success(201, 'Subject successfully created', { subject });

        await Expert.updateMany({}, { $push: { subjects: subject._id } });
        await calculateAllExpertScoresSingleSubject(subject._id);
        await calculateAverageScoresAllExperts();
    }))

    .delete(checkAuth('admin'), safeHandler(async (req, res) => {
        const subjects = await Subject.find();
        if (!subjects || subjects.length === 0) {
            throw new ApiError(404, 'No subjects found', 'NO_SUBJECTS_FOUND');
        }
        await Promise.all([
            Subject.deleteMany({}),
            Expert.updateMany({}, { $set: { subjects: [], candidates: [] } }),
            Candidate.deleteMany({}),
        ]);
        res.success(200, 'All subjects successfully deleted', { subjects });
    }));

router.route('/:id')
    .get(checkAuth('candidate'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid subject ID', 'INVALID_ID');
        const { candidates, experts, feedbacks } = req.query;

        let populateOptions = [];
        if ((candidates === "true" || candidates === true) && config.priority[req.user.role] >= config.priority['expert']) {
            populateOptions.push({
                path: 'candidates',
                select: '-password',
            });
        }
        if ((experts === "true" || experts === true) && config.priority[req.user.role] >= config.priority['admin']) {
            populateOptions.push({
                path: 'experts',
                select: '-password',
            });
        }

        if ((feedbacks === "true" || feedbacks === true) && config.priority[req.user.role] >= config.priority['admin']) {
            populateOptions.push({
                path: 'feedbacks',
                select: '-password',
            });
        }

        const subject = await Subject.findById(id).populate(populateOptions);

        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }
        return res.success(200, 'Subject found', { subject });
    }))

    .patch(checkAuth('admin'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid subject ID', 'INVALID_ID');

        const updates = subjectUpdateSchema.parse(req.body);

        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, value]) => value != null)
        );

        if (Object.keys(filteredUpdates).length === 0) {
            throw new ApiError(400, 'No updates provided', 'NO_UPDATES_PROVIDED');
        }

        const subject = await Subject.findByIdAndUpdate(
            id,
            filteredUpdates,
            {
                new: true,
                runValidators: true
            }
        )

        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }
        res.success(200, 'Subject updated successfully', { subject });

        if (filteredUpdates.skills) {
            await Promise.all([calculateAllCandidateScoresSingleSubject(id), calculateAllExpertScoresSingleSubject(id)]);
            await Promise.all([calculateAverageScoresAllExperts()]);
        }
    }))

    .put(checkAuth('admin'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid subject ID', 'INVALID_ID');

        const updates = subjectSchema.parse(req.body);

        const subject = await Subject.findByIdAndUpdate(
            id,
            updates,
            {
                new: true,
                runValidators: true
            }
        )

        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }

        res.success(200, 'Subject updated successfully', { subject });

        await calculateAllCandidateScoresSingleSubject(id);
        await calculateAllExpertScoresSingleSubject(id);
        await calculateAverageScoresAllExperts();

    }))

    .delete(checkAuth('admin'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid subject ID', 'INVALID_ID');

        const subject = await Subject.findByIdAndDelete(id);
        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }

        try {
            await Promise.all([
                Candidate.deleteMany({ _id: { $in: subject.candidates.map(candidate => candidate.id) } }),
                Expert.updateMany(
                    { _id: { $in: subject.experts.map(expert => expert.id) } },
                    { 
                        $pull: { 
                            subjects: id,
                            candidates: { $in: subject.candidates.map(candidate => candidate.id) }
                        }
                    }
                ),
            ]);

        } catch (error) {
            console.error('Error deleting subject:', error);
        }
        res.success(200, 'Subject deleted successfully', { subject });
        await Promise.all([calculateAverageScoresAllExperts()]);
    }));

router.route('/:id/candidate')

    .get(checkAuth('expert'), safeHandler(async (req, res) => { 
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid subject ID', 'INVALID_ID');

        const { education, experience } = req.body;

        const subject = await Subject.findById(id)
            .populate({
                path: 'candidates.id',
                select: getSelectedFields({ education, experience })
            });

        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }
        return res.success(200, 'All candidates retrieved', { candidates: subject.candidates });
    }))

router.route('/:id/expert')
    .get(checkAuth('admin'), safeHandler(async (req, res) => { 
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid subject ID', 'INVALID_ID');

        const { education, experience } = req.body;

        const subject = await Subject.findById(id)
            .populate({
                path: 'experts.id',
                select: getSelectedFields({ education, experience })
            });

        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }
        return res.success(200, 'All experts retrieved', { experts: subject.experts });
    }))

    .post(checkAuth('admin'), safeHandler(async (req, res) => {
        const { id } = req.params;
        const { expertId } = req.body;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid subject ID', 'INVALID_ID');
        if (!isValidObjectId(expertId)) throw new ApiError(400, 'Invalid expert ID', 'INVALID_ID');

        const subject = await Subject.findById(id);
        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }

        const expertAlreadyAdded = subject.experts.some(expert => expert.id.equals(expertId));
        if (expertAlreadyAdded) {
            throw new ApiError(400, 'Expert already added the subject', 'ALREADY_ADDED');
        }

        const expert = await Expert.findById(expertId);
        if (!expert) {
            throw new ApiError(404, 'Expert not found', 'EXPERT_NOT_FOUND');
        }

        expert.subjects.push(id);
        subject.experts.push({
            id: expertId,
            profileScore: 0,
            relevancyScore: 0
        });

        await Promise.all([expert.save(), subject.save()]);
        res.success(200, 'Expert successfully added to the subject', { subject });
        await calculateSingleExpertScoresSingleSubject(id, expertId);
        await calculateAverageScoresSingleExpert(expertId);
    }));

    router.route('/:id/sorteddata')
    .get(checkAuth('admin'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid subject ID', 'INVALID_ID');

        const subject = await Subject.findById(id).populate('candidates.id experts.id');
        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }

        const sortedData = {
            candidates: subject.candidates.sort((a, b) => b.relevancyScore - a.relevancyScore),
            experts: subject.experts.sort((a, b) => b.relevancyScore - a.relevancyScore)
        };
        const newSortedData = {
            candidates: sortedData.candidates.map(candidate => {
                return {
                    profileScore: candidate.profileScore,
                    relevancyScore: candidate.relevancyScore,
                    ...candidate.id
                };
            }),
            experts: sortedData.experts.map(expert => {
                return {
                    profileScore: expert.profileScore,
                    relevancyScore: expert.relevancyScore,
                    ...expert.id
                };
            })
        };

        return res.success(200, 'Sorted data retrieved', { experts: newSortedData.experts, candidates: newSortedData.candidates });
    }
    ));



export default router;