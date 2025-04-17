import express, { Router } from "express";
import {validation} from '@middleware/validation';
import {validator} from '@middleware/validator';
import {auth} from '@controller/v1/auth';
import {upload} from "@config/fileUpload";
const router:Router = express.Router();


router.get('/api/v1/auth/user_listing',validator.validateHeaderToken,validator.extractHeaderLanguage,auth.userListing);

router.post('/api/v1/auth/signup',validator.extractHeaderLanguage,upload.single("profileImage"),validation.signupValidation,auth.signup);  

router.post('/api/v1/auth/login',validator.extractHeaderLanguage,validation.loginValidation,auth.login); 

router.post('/api/v1/auth/verify_otp',validator.validateHeaderToken,validator.extractHeaderLanguage,validation.verifyOtp,auth.verifyOtp); 

router.post('/api/v1/auth/resend_otp',validator.validateHeaderToken,validator.extractHeaderLanguage,auth.resendOtp); 

router.post('/api/v1/auth/change_password',validator.validateHeaderToken,validator.extractHeaderLanguage,validation.changePassword,auth.changePassword); 

router.post('/api/v1/auth/forgot_password',validator.extractHeaderLanguage,validation.forgotPassword,auth.forgotPassword); 

router.post('/api/v1/auth/book_session',validator.validateHeaderToken,validator.extractHeaderLanguage,validation.booksession,auth.bookSession); 

router.post('/api/v1/auth/change_status',validator.validateHeaderToken,validator.extractHeaderLanguage,validation.changeStatus,auth.changestatus); 

router.post('/api/v1/auth/read_file',validation.fileSystem,auth.fileSystem); 

// router.get('/:id',auth.profile_image); 




export{ router };