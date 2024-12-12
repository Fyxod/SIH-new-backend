import { z } from 'zod';

export const adminSchema = z.object({
    username: z.string()
        .min(3, { message: 'Username must be at least 3 characters long.' })
        .max(50, { message: 'Username must be at most 50 characters long.' }),
    password: z.string()
        .min(6, { message: 'Password must be at least 6 characters long.' })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]])[A-Za-z\d!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]]{6,}$/, { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' }),
});

export const registerAdminSchema = z.object({
    username: z.string({ message: 'Username is required.' })
        .min(3, { message: 'Username must be at least 3 characters long.' })
        .max(50, { message: 'Username must be at most 50 characters long.' }),
    password: z.string({ message: 'Password is required' })
        .min(6, { message: 'Password must be at least 6 characters long.' })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]])[A-Za-z\d!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]]{6,}$/, { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' }),
    confirmPassword: z.string({ message: "Confirm password field is required" })
        .min(6, { message: 'Confirm password must be at least 6 characters long.' })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]])[A-Za-z\d!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]]{6,}$/, { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' }),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

export const updateAdminSchema = z.object({
    username: z.string({ message: 'Username is required.' })
        .min(3, { message: 'Username must be at least 3 characters long.' })
        .max(50, { message: 'Username must be at most 50 characters long.' })
        .optional(),
    password: z.string({ message: 'Password is required' })
        .min(6, { message: 'Password must be at least 6 characters long.' })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]])[A-Za-z\d!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]]{6,}$/, { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' })
        .optional(),
    confirmPassword: z.string({ message: "Confirm password field is required" })
        .min(6, { message: 'Confirm password must be at least 6 characters long.' })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]])[A-Za-z\d!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]]{6,}$/, { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' })
        .optional(),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

export const expertRegistrationSchema = z.object({
    name: z
        .string({ required_error: 'Name is required.' })
        .min(3, { message: 'Name must be at least 3 characters long.' })
        .max(50, { message: 'Name must be at most 50 characters long.' })
        .transform((name) => name.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')),
    email: z
        .string({ required_error: 'Email is required.' })
        .email({ message: 'Please enter a valid email address.' })
        .max(100, { message: 'Email must not exceed 100 characters.' }),
    mobileNo: z
        .string({ required_error: 'Mobile number is required.' })
        .length(10, { message: 'Mobile number must be 10 digits long.' })
        .regex(/^[6-9]\d{9}$/, { message: 'Please enter a valid mobile number.' }),
    gender: z.enum(["male", "female", "non-binary", "other"], {
        required_error: "Gender is required.",
        invalid_type_error: "Invalid gender selection."
    }),
    dateOfBirth: z.string().date({ required_error: 'Date of birth is required.', invalid_type_error: 'Invalid date of birth.' }),
    currentPosition: z
        .string({ required_error: 'Current position is required.' })
        .min(2, { message: 'Current position must be at least 2 characters long.' })
        .max(50, { message: 'Current position must be at most 50 characters long.' }),
    currentDepartment: z
        .string({ required_error: 'Current department is required.' })
        .min(2, { message: 'Current department must be at least 2 characters long.' })
        .max(50, { message: 'Current department must be at most 50 characters long.' }),
    skills: z.array(
        z.object({
            skill: z.string({ required_error: 'Skill is required.' }).max(30, { message: 'Each skill must not exceed 30 characters.' }),
            duration: z.number().optional(),
        }),
        { required_error: 'At least one skill is required.' }
    ),
    bio: z
        .string()
        .max(500, { message: 'Bio must be at most 500 characters long.' })
        .optional(),
    experience: z
        .array(
            z.object({
                department: z
                    .string({ required_error: 'Department is required.' })
                    .min(2, { message: 'Department must be at least 2 characters long.' })
                    .max(50, { message: 'Department must be at most 50 characters long.' }),
                position: z
                    .string({ required_error: 'Position is required.' })
                    .min(2, { message: 'Position must be at least 2 characters long.' })
                    .max(50, { message: 'Position must be at most 50 characters long.' }),
                startDate: z.string().date({ required_error: 'Start date is required.' }),
                endDate: z.string().date({ required_error: 'End date is required.' }).optional(),
                companyName: z
                    .string()
                    .min(2, { message: 'Company name must be at least 2 characters long.' })
                    .max(50, { message: 'Company name must be at most 50 characters long.' })
                    .optional(),
            }),
            { required_error: 'At least one experience is required.' }
        )
        .min(1, { message: 'At least one experience is required.' }),
    education: z
        .array(
            z.object({
                degree: z
                    .string({ required_error: 'Degree is required.' })
                    .min(2, { message: 'Degree must be at least 2 characters long.' })
                    .max(50, { message: 'Degree must be at most 50 characters long.' }),
                field: z
                    .string({ required_error: 'Field is required.' })
                    .min(3, { message: 'Field must be at least 3 characters long.' })
                    .max(50, { message: 'Field must be at most 50 characters long.' }),
                institute: z
                    .string({ required_error: 'Institute name is required.' })
                    .min(2, { message: 'Institute name must be at least 2 characters long.' })
                    .max(50, { message: 'Institute name must be at most 50 characters long.' }),
                startDate: z.string().date({ required_error: 'Start date is required.', invalid_type_error: 'Invalid start date.' }),
                endDate: z.string().date({ invalid_type_error: 'Invalid end date.' }).optional(),
            }),
            { required_error: 'At least one education is required.' }
        )
        .min(1, { message: 'At least one education entry is required.' }),
    linkedin: z
        .string()
        .url({ message: 'Please enter a valid LinkedIn URL.' })
        .max(200, { message: 'LinkedIn URL must not exceed 200 characters.' })
        .optional(),
    resumeToken: z.string().optional(),
});


export const expertLoginSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(6, { message: 'Password is at least 6 characters long.' }),
});

export const expertUpdateSchema = z.object({
    name: z
        .string()
        .min(3, { message: 'Name must be at least 3 characters long.' })
        .max(50, { message: 'Name must be at most 50 characters long.' })
        .transform((name) => name.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' '))
        .optional(),
    email: z
        .string().
        email({ message: 'Please enter a valid email address.' })
        .max(100, { message: 'Email must not exceed 100 characters.' })
        .optional(),
    mobileNo: z
        .string()
        .length(10, { message: 'Mobile number must be 10 digits long.' })
        .regex(/^[6-9]\d{9}$/, { message: 'Please enter a valid mobile number.' })
        .optional(),
    gender: z.enum(["male", "female", "non-binary", "Other"], {
        invalid_type_error: "Invalid gender selection."
    }).optional(),
    dateOfBirth: z.string().date({ invalid_type_error: 'Invalid date of birth.' }).optional(),
    currentPosition: z
        .string()
        .min(2, { message: 'Current position must be at least 2 characters long.' })
        .max(50, { message: 'Current position must be at most 50 characters long.' })
        .optional(),
    currentDepartment: z
        .string()
        .min(2, { message: 'Current department must be at least 2 characters long.' })
        .max(50, { message: 'Current department must be at most 50 characters long.' })
        .optional(),
    skills: z.array(
        z.object({
            skill: z.string().max(30, { message: 'Each skill must not exceed 30 characters.' }),
            duration: z.number().optional(),
        }).optional(),
    ).min(1, { message: 'At least one skill is required.' })
        .optional(),
    bio: z
        .string()
        .max(500, { message: 'Bio must be at most 500 characters long.' })
        .optional(),
    experience: z.array(
        z.object({
            department: z
                .string({ required_error: 'Department is required.' })
                .min(3, { message: 'Department must be at least 3 characters long.' })
                .max(50, { message: 'Department must be at most 50 characters long.' }),
            position: z
                .string({ required_error: 'Position is required.' })
                .min(3, { message: 'Position must be at least 3 characters long.' })
                .max(50, { message: 'Position must be at most 50 characters long.' }),
            startDate: z.string().date({ required_error: 'Start date is required.' }),
            endDate: z.string().date({ required_error: 'End date is required.' }).optional(),
            companyName: z
                .string()
                .min(2, { message: 'Company name must be at least 2 characters long.' })
                .max(50, { message: 'Company name must be at most 50 characters long.' })
                .optional(),
        })).optional(),
    education: z
        .array(
            z.object({
                degree: z
                    .string({ required_error: 'Degree is required.' })
                    .min(2, { message: 'Degree must be at least 2 characters long.' })
                    .max(50, { message: 'Degree must be at most 50 characters long.' }),
                field: z
                    .string({ required_error: 'Field is required.' })
                    .min(3, { message: 'Field must be at least 3 characters long.' })
                    .max(50, { message: 'Field must be at most 50 characters long.' }),
                institute: z
                    .string({ required_error: 'Institute name is required.' })
                    .min(3, { message: 'Institute name must be at least 3 characters long.' })
                    .max(50, { message: 'Institute name must be at most 50 characters long.' }),
                startDate: z.string().date({ required_error: 'Start date is required.', invalid_type_error: 'Invalid start date.' }),
                endDate: z.string().date({ message: 'Invalid end date.' }).optional(),
            })).optional(),
    linkedin: z
        .string()
        .url({ message: 'Please enter a valid LinkedIn URL.' })
        .max(200, { message: 'LinkedIn URL must not exceed 200 characters.' })
        .optional(),
    resumeToken: z.string().optional(),
    password: z
        .string({ required_error: 'Password is required.' })
        .min(6, { message: 'Password must be at least 6 characters long.' })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]])[A-Za-z\d!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]]{6,}$/, { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' })
        .optional(),
    confirmPassword: z
        .string({ required_error: 'Confirm password is required.' })
        .min(6, { message: 'Confirm password must be at least 6 characters long.' })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]])[A-Za-z\d!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]]{6,}$/, { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' })
        .optional(),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

//schema for candidate 

export const candidateLoginSchema = z.object({
    email: z.string().email({ message: 'Enter a valid email address.' }),
    password: z
        .string({ required_error: 'Password is required.' })
        .min(6, { message: 'Password must be at least 6 characters long.' })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]])[A-Za-z\d!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]]{6,}$/, { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' }),
});

export const candidateRegistrationSchema = z.object({
    name: z
        .string({ required_error: 'Name is required.' })
        .min(2, { message: 'Name must be at least 2 characters long.' })
        .max(50, { message: 'Name must not exceed 50 characters.' })
        .transform((name) => name.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')),

    email: z
        .string({ required_error: 'Email is required.' })
        .email({ message: 'Please enter a valid email address.' })
        .max(100, { message: 'Email must not exceed 100 characters.' }),

    mobileNo: z
        .string({ required_error: 'Mobile number is required.' })
        .length(10, { message: 'Mobile number must be 10 digits long.' })
        .regex(/^[6-9]\d{9}$/, { message: 'Please enter a valid mobile number.' }),

    gender: z.enum(["male", "female", "non-binary", "other"], {
        required_error: "Gender is required.",
        invalid_type_error: "Invalid gender selection."
    }),

    dateOfBirth: z.string().date({ required_error: 'Date of birth is required.', invalid_type_error: 'Invalid date of birth.' }),

    skills: z.array(
        z.object({
            skill: z.string({ required_error: 'Skill is required.' }).max(30, { message: 'Each skill must not exceed 30 characters.' }),
            duration: z.number().optional(),
        }),
        { required_error: 'At least one skill is required.' }
    ),

    bio: z
        .string({ required_error: 'Bio is required.' })
        .max(500, { message: 'Bio must not exceed 500 characters.' })
        .optional(),

    experience: z
        .array(
            z.object({
                position: z
                    .string({ required_error: 'Position is required.' })
                    .min(2, { message: 'Position must be at least 2 characters long.' })
                    .max(50, { message: 'Position must not exceed 50 characters.' }),
                department: z
                    .string({ required_error: 'Department is required.' })
                    .min(2, { message: 'Department must be at least 2 characters long.' })
                    .max(50, { message: 'Department must not exceed 50 characters.' }),
                startDate: z.string().date({ required_error: 'Start date is required.' }),
                endDate: z.string().date({ required_error: 'End date is required.' }).optional(),
                companyName: z
                    .string({ required_error: 'Company name is required.' })
                    .max(100, { message: 'Company name must not exceed 100 characters.' })
                    .optional()
            }),
            { required_error: 'At least one experience is required.' }
        ),

    education: z
        .array(
            z.object({
                degree: z
                    .string({ required_error: 'Degree is required.' })
                    .min(2, { message: 'Degree must be at least 2 characters long.' })
                    .max(50, { message: 'Degree must not exceed 50 characters.' }),
                institute: z
                    .string({ required_error: 'Institute is required.' })
                    .min(2, { message: 'Institute must be at least 2 characters long.' })
                    .max(50, { message: 'Institute must not exceed 50 characters.' }),
                startDate: z.string().date({ required_error: 'Start date is required.', invalid_type_error: 'Invalid start date.' }),
                endDate: z.string().date({ invalid_type_error: 'Invalid end date.' }).optional(),
                field: z
                    .string({ required_error: 'Field is required.' })
                    .min(2, { message: 'Field must be at least 2 characters long.' })
                    .max(50, { message: 'Field must not exceed 50 characters.' })
            }),
            { required_error: 'At least one education is required.' }
        ),

    linkedIn: z
        .string()
        .url({ message: 'Invalid LinkedIn URL.' })
        .max(200, { message: 'LinkedIn URL must not exceed 200 characters.' })
        .optional(),

    password: z
        .string({ required_error: 'Password is required.' })
        .min(6, { message: 'Password must be at least 6 characters long.' })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]])[A-Za-z\d!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]]{6,}$/, { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' }),

    confirmPassword: z
        .string({ required_error: 'Confirm password is required.' })
        .min(6, { message: 'Confirm password must be at least 6 characters long.' })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]])[A-Za-z\d!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]]{6,}$/, { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' }),

    resumeToken: z.string().optional(),

    subject: z
        .string({ required_error: 'Subject is required.' })
        .regex(/^[0-9a-fA-F]{24}$/, { message: 'Subject must be a valid Mongoose ObjectId.' })
}).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    field: ['confirmPassword'],
});


export const candidateUpdateSchema = z.object({
    name: z
        .string()
        .min(2, { message: 'Name must be at least 2 characters long.' })
        .max(50, { message: 'Name must not exceed 50 characters.' })
        .transform((name) => name.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' '))
        .optional(),

    email: z
        .string()
        .email({ message: 'Invalid email format.' })
        .max(100, { message: 'Email must not exceed 100 characters.' })
        .optional(),

    mobileNo: z
        .string()
        .length(10, { message: 'Mobile number must be 10 digits long.' })
        .regex(/^[6-9]\d{9}$/, { message: 'Please enter a valid mobile number.' })
        .optional(),

    gender: z.enum(["male", "female", "non-binary", "other"], {
        required_error: "Gender is required.",
        invalid_type_error: "Invalid gender selection."
    }).optional(),

    dateOfBirth: z.string().date({ invalid_type_error: 'Invalid date of birth.' }).optional(),

    skills: z.array(
        z.object({
            skill: z.string({ required_error: 'Skill is required.' }).max(30, { message: 'Each skill must not exceed 30 characters.' }),
            duration: z.number().optional(),
        }).optional(),
    ),

    bio: z
        .string()
        .max(500, { message: 'Bio must not exceed 500 characters.' })
        .optional(),

    experience: z
        .array(
            z.object({
                position: z
                    .string({ required_error: 'Position is required.' })
                    .min(2, { message: 'Position must be at least 2 characters long.' })
                    .max(50, { message: 'Position must not exceed 50 characters.' }),
                department: z
                    .string({ required_error: 'Department is required.' })
                    .min(2, { message: 'Department must be at least 2 characters long.' })
                    .max(50, { message: 'Department must not exceed 50 characters.' }),
                startDate: z.string().date({ required_error: 'Start date is required.' }),
                endDate: z.string().date({ required_error: 'End date is required.' }).optional(),
                companyName: z
                    .string()
                    .max(100, { message: 'Company name must not exceed 100 characters.' })
                    .optional()
            })
        )
        .optional(),

    education: z
        .array(
            z.object({
                degree: z
                    .string({ required_error: 'Degree is required.' })
                    .min(2, { message: 'Degree must be at least 2 characters long.' })
                    .max(50, { message: 'Degree must not exceed 50 characters.' }),
                institute: z
                    .string({ required_error: 'Institute is required.' })
                    .min(2, { message: 'Institute must be at least 2 characters long.' })
                    .max(100, { message: 'Institute must not exceed 100 characters.' }),
                startDate: z.string().date({ message: 'Invalid start date.' }),
                endDate: z.string().date({ message: 'Invalid end date.' }).optional(),
                field: z
                    .string({ required_error: 'Field is required.' })
                    .min(2, { message: 'Field must be at least 2 characters long.' })
                    .max(50, { message: 'Field must not exceed 50 characters.' })
            })
        )
        .optional(),

    linkedIn: z
        .string()
        .url({ message: 'Invalid LinkedIn URL.' })
        .max(200, { message: 'LinkedIn URL must not exceed 200 characters.' })
        .optional(),

    resumeToken: z.string().optional(),

    password: z
        .string({ required_error: 'Password is required.' })
        .min(6, { message: 'Password must be at least 6 characters long.' })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]])[A-Za-z\d!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]]{6,}$/, { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' })
        .optional(),
        
    confirmPassword: z
        .string({ required_error: 'Confirm password is required.' })
        .min(6, { message: 'Confirm password must be at least 6 characters long.' })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]])[A-Za-z\d!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]]{6,}$/, { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' })
        .optional(),

}).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

// schema for subject

export const subjectRegistrationSchema = z.object({
    title: z.string({ required_error: 'Title is required.', invalid_type_error: 'Invalid title.' })
        .trim()
        .min(3, { message: 'Title must be at least 3 characters long.' })
        .max(50, { message: 'Title must be at most 50 characters long.' }),

    description: z.string({ required_error: 'Description is required.', invalid_type_error: 'Invalid description.' })
        .trim()
        .min(10, { message: 'Description must be at least 10 characters long.' })
        .max(500, { message: 'Description must be at most 500 characters long.' }),

    department: z.string({ required_error: 'Department is required.', invalid_type_error: 'Invalid department.' })
        .trim()
        .min(3, { message: 'Department must be at least 3 characters long.' })
        .max(50, { message: 'Department must be at most 50 characters long.' }),

    type: z.preprocess(
        (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
        z.enum(["full-time", "part-time", "research", "teaching", "project", "scholarship", "internship", "fellowship", "consultancy", "others"], {
            required_error: "Type is required.",
            invalid_type_error:
                "Type must be either 'full-time', 'part-time', 'research', 'teaching', 'project', 'scholarship', 'internship', 'fellowship', or 'others'.",
        })
    ),

    locationType: z.preprocess(
        (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
        z.enum(["remote", "onsite", "hybrid"], {
            required_error: "Location type is required.",
            invalid_type_error: "Location type must be either 'remote', 'onsite', or 'hybrid'.",
        })
    ),

    location: z.string().optional(),
    duration: z.string().optional(),

    recommendedSkills: z.array(
        z.object({
            skill: z.string({ required_error: 'Skill is required.', invalid_type_error: 'Invalid skill type.' })
                .max(40, { message: 'Skill must be at most 40 characters long.' }),
            description: z.string().optional()
        })
    ).min(1, { message: 'At least one skill is required.' })
});

export const subjectUpdateSchema = z.object({
    title: z.string()
        .trim()
        .min(3, { message: 'Title must be at least 3 characters long.' })
        .max(50, { message: 'Title must be at most 50 characters long.' })
        .optional(),

    description: z.string()
        .trim()
        .min(10, { message: 'Description must be at least 10 characters long.' })
        .max(500, { message: 'Description must be at most 500 characters long.' })
        .optional(),

    department: z.string()
        .trim()
        .min(3, { message: 'Department must be at least 3 characters long.' })
        .max(50, { message: 'Department must be at most 50 characters long.' })
        .optional(),

    type: z.enum(["open", "closed"], {
        required_error: "Type is required.",
        invalid_type_error: "Type must be either 'open' or 'closed'."
    }).optional(),

    recommendedSkills: z.array(
        z.string()
            .trim()
            .min(1, { message: 'Skill must be at least 1 characters long.' })
            .max(40, { message: 'Each skill must be at most 40 characters long.' })
    ).min(1, { message: 'At least one skill is required.' })
        .optional(),

    status: z.enum(["open", "closed"], {
        required_error: "Status is required."
    }).optional(),
});

export const interviewDetailsSchema = z.object({
    date: z.date().optional(),
    time: z.string().optional(),
    platform: z.enum(["zoom", "googleMeet", "microsoftTeams", "offline"]).optional(),
    link: z.string().url().optional(),
    venue: z.string().optional(),
    conducted: z.boolean().optional(),
});

export const extraExpertSchema = z.object({ 
    name: z.string().min(3).max(50).optional(),
    link: z.string().url().optional(),
    institution: z.string().min(3).max(50).optional(),
    interests: z.string().min(3).max(50).optional(),
});