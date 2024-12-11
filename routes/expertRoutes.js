import express from 'express';
import checkAuth from '../middlewares/authMiddleware.js';
import Expert from '../models/expert.js';
import { safeHandler } from '../middlewares/safeHandler.js';
import { expertImageUpload, resumeUpload } from '../utils/multer.js';
import ApiError from '../utils/errorClass.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import FormData from 'form-data';
import { generateToken, verifyToken } from '../utils/jwtFuncs.js';
import { expertRegistrationSchema, expertLoginSchema, expertUpdateSchema } from '../utils/zodSchemas.js';
import path from 'path';
import config from '../config/config.js';
import getSelectedFields from '../utils/selectFields.js';
import { isValidObjectId } from 'mongoose';
import Subject from '../models/subject.js';
import { calculateAverageScoresSingleExpert, calculateSingleExpertScoresMultipleSubjects } from '../utils/updateScores.js';
const tempResumeFolder = config.paths.resume.temporary;
const expertResumeFolder = config.paths.resume.expert;

import { fileURLToPath } from 'url';
import Candidate from '../models/candidate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = express.Router();
// the rout / is being used to do crud of an expert by admin or someone of higher level
router.route('/')
    .get(checkAuth("admin"), safeHandler(async (req, res) => {
        const experts = await Expert.find().select("-password");
        if (!experts || experts.length === 0) {
            throw new ApiError(404, "No experts found", "NO_EXPERTS_FOUND");
        }
        return res.success(200, "All experts successfully retrieved", { experts });
    }))
    .post(checkAuth("admin"), safeHandler(async (req, res) => {
        const fields = expertRegistrationSchema.parse(req.body);
        // { name, email, mobileNo, gender, bio, dateOfBirth, education, experience, currentPosition, currentDepartment, skills, linkedin, resumeToken }
        // will apply multer for image later
        console.log(fields.email, fields.mobileNo, fields.linkedin);
        const expertExists = await Expert.findOne({
            $or:
                [
                    { email: fields.email },
                    { mobileNo: fields.mobileNo }
                ]
        });
        console.error("Printing existing expert here", expertExists);
        if (expertExists) {
            let existingField;
            console.error("Inside the if condition");
            if (expertExists.email === fields.email) existingField = 'Email';
            else if (expertExists.mobileNo === fields.mobileNo) existingField = 'Mobile number';

            throw new ApiError(400, `Expert already exists with this ${existingField}`, "EXPERT_ALREADY_EXISTS");
        }
        let newResumeName = null;

        if (fields.resumeToken) {
            try {
                const payload = verifyToken(fields.resumeToken);
                const resumeName = payload.resumeName;

                newResumeName = `${fields.name.split(' ')[0]}_resume_${new Date().getTime()}.pdf`;

                try {
                    axios.post(`${process.env.RESUME_UPLOAD_URL}/upload/resume/changename`, { newResumeName, oldResumeName: resumeName, person: "expert" })
                } catch (error) {
                    console.log("Error while sending resume token to other server", error)
                }
                fields.resume = newResumeName;

                delete fields.resumeToken;
            } catch (error) {
                console.log("Error processing resume during registration", error);
            }
        }
        // uploading image here
        if (req.file) {
            const formData = new FormData();

            fields.image = `${fields.name.split(' ')[0]}_image_${new Date().getTime()}${path.extname(req.file.originalname)}`;

            const destinationFolder = path.join(__dirname, `../public/${config.paths.image.expert}`);
            const newFilePath = path.join(destinationFolder, fields.image)
            await fs.promises.rename(req.file.path, newFilePath);

            formData.append("image", fs.createReadStream(newFilePath));

            await axios.post(`${process.env.RESUME_UPLOAD_URL}/upload/image/expert`, formData,
                {
                    headers: {
                        ...formData.getHeaders()
                    }
                }
            )
            fs.promises.unlink(newFilePath);
        }

        const password = `${fields.name.split(' ')[0].toUpperCase()}@${new Date(fields.dateOfBirth).getFullYear()}`;
        fields.password = await bcrypt.hash(password, 10);
        const expert = await Expert.create(fields);
        // send encrypted password pdf to email
        res.success(201, "Expert successfully created", { expert: { id: expert._id, email: expert.email, name: expert.name } });

        const subjects = await Subject.find();
        expert.subjects.push(...subjects.map(s => s._id));
        await Promise.all(subjects.map(async s => {
            s.experts.push({ id: expert._id, relevancyScore: 0, profileScore: 0 });
            await s.save();
        }));

        await expert.save();

        await calculateSingleExpertScoresMultipleSubjects(expert._id);
        calculateAverageScoresSingleExpert(expert._id);
    }))

    // i think we should not have this route it will deleate all experts which is not good - bugslayer01
    // I disagree. An API should have all the functionalities - fyxod
    // so u should atleast have a fail safe what if this endpoint was hit by mistake you will lose all ur data - bugslayer01

    .delete(checkAuth("admin"), safeHandler(async (req, res) => {
        const experts = await Expert.find().select("-password");
        if (!experts || experts.length === 0) {
            throw new ApiError(404, "No experts found", "NO_EXPERTS_FOUND");
        }
        await Expert.deleteMany();
        if (!experts) {
            throw new ApiError(404, "No experts found", "NO_EXPERTS_FOUND");
        }

        await Promise.all([
            Subject.updateMany({}, { $pull: { experts: { $in: experts.map(e => e._id) } } }), // change this to $set if it doesn't work
            (async () => {
                const folderPath = path.join(__dirname, `../public/${expertResumeFolder}`);
                try {
                    await fs.promises.access(folderPath);
                    await fs.promises.rmdir(folderPath, { recursive: true });
                } catch (error) {
                    console.error(`Failed to remove directory: ${folderPath}`, error);
                }
            })(),
            Candidate.updateMany({}, { $set: { panel: [] } }),
            // Add if remember more
        ]);

        return res.success(200, "All experts successfully deleted", { experts });
    }));

router.route('/:id')
    .get(checkAuth("expert"), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, "Invalid expert ID", "INVALID_ID");
        const { education, experience } = req.query;

        const expert = await Expert.findById(id).select(getSelectedFields({ education, experience }));

        if (!expert) {
            throw new ApiError(404, "Expert not found", "EXPERT_NOT_FOUND");
        }
        return res.success(200, "Expert found", { expert });
    }))

    .patch(checkAuth("expert"), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, "Invalid expert ID", "INVALID_ID");

        const updates = expertUpdateSchema.parse(req.body);

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
            const expertExists = await Expert.findOne({
                $or: uniqueCheck
            });

            if (expertExists && expertExists._id.toString() !== id) {
                let existingField;

                if (expertExists.email === filteredUpdates.email) existingField = 'Email';
                else if (expertExists.mobileNo === filteredUpdates.mobileNo) existingField = 'Mobile number';
                else if (expertExists.linkedIn && expertExists.linkedin === filteredUpdates.linkedin) existingField = 'Linkedin id';

                throw new ApiError(400, `Expert already exists with this ${existingField}`, "EXPERT_ALREADY_EXISTS");
            }
        }

        if (filteredUpdates.resumeToken) {
            try {
                const payload = verifyToken(filteredUpdates.resumeToken);
                const resumeName = payload.resumeName;
                const resumePath = path.join(__dirname, `../public/${tempResumeFolder}/${resumeName}`);

                const fileExists = await fs.promises.access(resumePath).then(() => true).catch(() => false);

                if (fileExists) {
                    const expert = await Expert.findById(id);
                    if (expert?.resume) {
                        try {
                            await fs.promises.unlink(path.join(__dirname, `../public/${expertResumeFolder}/${expert.resume}`));
                        } catch (error) {
                            if (error.code === 'ENOENT') {
                                console.log('File does not exist');
                            } else {
                                console.error('An error occurred:', error);
                            }
                        }
                    }

                    const newResumeName = `${expert.name.split(' ')[0]}_resume_${new Date().getTime()}.pdf`;
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

        const expert = await Expert.findByIdAndUpdate(
            id,
            filteredUpdates,
            {
                new: true,
                runValidators: true,
            }
        ).select("-password");

        if (!expert) {
            throw new ApiError(404, "Expert not found", "EXPERT_NOT_FOUND");
        }

        res.success(200, "Expert updated successfully", { expert });

        if (filteredUpdates.skills) {
            await calculateSingleExpertScoresMultipleSubjects(expert._id);
            calculateAverageScoresSingleExpert(expert._id);
        }

    }))

    .delete(checkAuth("admin"), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, "Invalid expert ID", "INVALID_ID");

        const expert = await Expert.findByIdAndDelete(id).select("-password");
        if (!expert) {
            throw new ApiError(404, "Expert not found", "EXPERT_NOT_FOUND");
        }
        await Promise.all([
            (async () => {
                const filePath = path.join(__dirname, `../public/${expertResumeFolder}/${expert.resume}`);
                try {
                    await fs.promises.access(filePath, fs.constants.F_OK);
                    await fs.promises.unlink(filePath);
                } catch (error) {
                    if (error.code !== 'ENOENT') {
                        console.error(`Failed to delete file: ${filePath}`, error);
                    }
                }
            })(),
            Subject.updateMany({ _id: { $in: expert.subjects } }, { $pull: { experts: { id: expert._id } } }),
            Candidate.updateMany({ "panel.expert": expert._id }, { $pull: { panel: { expert: expert._id } } })
        ]);
        return res.success(200, "Expert deleted successfully", { expert });
    }));

export default router;