import express from 'express';
import Admin from '../models/admin.js';
import bcrypt from 'bcrypt';
import { adminSchema, registerAdminSchema, updateAdminSchema } from '../utils/zodSchemas.js';
import { safeHandler } from '../middlewares/safeHandler.js';
import ApiError from '../utils/errorClass.js';
import { generateToken } from '../utils/jwtFuncs.js';
import checkAuth from '../middlewares/authMiddleware.js';
import { isValidObjectId } from 'mongoose';

const router = express.Router();

router.get('/', checkAuth("superadmin"), safeHandler(async (req, res) => {
    const admins = await Admin.find().select("-password");
    if (!admins || admins.length === 0) {
        throw new ApiError(404, "No admins found", "NO_ADMINS_FOUND");
    }
    return res.success(200, "All admins successfully retrieved", { admins });
}));

router.post('/signin', safeHandler(async (req, res) => {
    const { username, password } = adminSchema.parse(req.body);
    const admin = await Admin.findOne({ username });
    if (!admin) {
        throw new ApiError(404, "Invalid email or password", "ADMIN_NOT_FOUND");
    }
    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
        throw new ApiError(404, "Invalid email or password", "INVALID_CREDENTIALS");
    }
    const userToken = generateToken({ id: admin._id, role: admin.role });
    res.cookie("userToken", userToken, { httpOnly: true });
    return res.success(200, "Successfully logged in", { userToken, id: admin._id, role: admin.role });
}));

router.post('/signup', checkAuth('superadmin'), safeHandler(async (req, res) => {
    const { username, password } = registerAdminSchema.parse(req.body);
    const admin = await Admin.findOne({ username });
    if (admin) {
        throw new ApiError(400, "Admin already exists", "ADMIN_EXISTS");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ username, password: hashedPassword});
    await newAdmin.save();
    return res.success(201, "Admin created successfully", { username }); //also send the new id after printing newAdmin to see where the is comes
}));

router.route('/:id')
    .get(checkAuth("superadmin"), safeHandler(async (req, res) => {
        const { id } = req.params;
        if(!isValidObjectId(id)) throw new ApiError(400, "Invalid admin ID", "INVALID_ID");
        const admin = await Admin.findById(id).select("-password");
        if (!admin) {
            throw new ApiError(404, "Admin not found", "ADMIN_NOT_FOUND");
        }
        return res.success(200, "Admin found", { admin });
    }))

    .patch(checkAuth("superadmin"), safeHandler(async (req, res) => {
        const { id } = req.params;
        if(!isValidObjectId(id)) throw new ApiError(400, "Invalid admin ID", "INVALID_ID");
        const updates = updateAdminSchema.parse(req.body);

        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, value]) => value != null)
        );

        if (filteredUpdates.password) {
            filteredUpdates.password = await bcrypt.hash(filteredUpdates.password, 10);
        }

        const admin = await Admin.findByIdAndUpdate(id, filteredUpdates, { new: true }).select("-password");
        if (!admin) {
            throw new ApiError(404, "Admin not found", "ADMIN_NOT_FOUND");
        }
        console.log("Admin updated: ", admin);
        return res.success(200, "Admin updated successfully", { username: admin.username });
    }))

    .delete(checkAuth("superadmin"), safeHandler(async (req, res) => {
        const { id } = req.params;
        if(!isValidObjectId(id)) throw new ApiError(400, "Invalid admin ID", "INVALID_ID");
        const admin = await Admin.findByIdAndDelete(id).select("-password");
        if (!admin) {
            throw new ApiError(404, "Admin not found", "ADMIN_NOT_FOUND");
        }
        return res.success(200, "Admin deleted successfully", { email: admin.email });
    }));

export default router;