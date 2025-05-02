import joi from 'joi';
import { Request, Response, NextFunction } from 'express';

class Validation{
    signupValidation = async (req:Request,res:Response,next:NextFunction) =>{        
        const schema :joi.ObjectSchema = joi.object({
            name: joi.string().min(3).max(50).required(),
            email: joi.string().email().required(),
            password: joi.string().min(6).max(20).required(),
            mobile_number: joi.string().pattern(/^[0-9]{10}$/).required(),
            profileImage: joi.string().pattern(/^[0-9]{10}$/).optional(),
        });
        const options:any = {
            errors: {
                wrap: {
                    label: false
                }
            },
            stripUnknown: true
        };        
        
        const {error}  = schema.validate(req.body,options);

        (error)? res.status(200).json({code:0 , messgae: error.details[0].message}):next();

        // (error)? common.sendResponse(res,"0",error.details[0].message,[]):next();
    }
    loginValidation = (req:Request,res:Response,next:NextFunction) =>{
        const schema :joi.ObjectSchema = joi.object({
            email: joi.string().email().required(),
            password: joi.string().min(6).max(20).required(),
        })
        
        const options:any = {
            errors: {
                wrap: {
                    label: false
                }
            },
            stripUnknown: true
        };
        const {error}  = schema.validate(req.body,options);

        (error)? res.status(200).json({code:0 , messgae: error.details[0].message}):next();
    }
    verifyOtp = (req:Request,res:Response,next:NextFunction)=>{
        const schema :joi.ObjectSchema = joi.object({
            otp:joi.required()
        })
        const options:any = {
            errors: {
                wrap: {
                    label: false
                }
            },
            stripUnknown: true
        };
        const {error}  = schema.validate(req.body,options);

        (error)? res.status(200).json({code:0 , messgae: error.details[0].message}):next();
    }
    changePassword = (req:Request,res:Response,next:NextFunction)=> {
        const schema :joi.ObjectSchema = joi.object({
            old_password:joi.string().required(),
            new_password:joi.string().required()
        })
        const options:any = {
            errors: {
                wrap: {
                    label: false
                }
            },
            stripUnknown: true
        };
        const {error}  = schema.validate(req.body,options);

        (error)? res.status(200).json({code:0 , messgae: error.details[0].message}):next();
    }
    forgotPassword =(req:Request,res:Response,next:NextFunction)=>{
        const schema :joi.ObjectSchema = joi.object({
            email:joi.string().required()
        })
        const options:any= {
            errors: {
                wrap: {
                    label: false
                }
            },
            stripUnknown: true
        };
        const {error}  = schema.validate(req.body,options);

        (error)? res.status(200).json({code:0 , messgae: error.details[0].message}):next();
    }

    booksession =(req:Request,res:Response,next:NextFunction)=>{
        const schema :joi.ObjectSchema = joi.object({
            creator_id:joi.required(),
            start_time:joi.string().required(),
            end_time:joi.string().required()
        })
        const options:any = {
            errors: {
                wrap: {
                    label: false
                }
            },
            stripUnknown: true
        };
        const {error}  = schema.validate(req.body,options);

        (error)? res.status(200).json({code:0 , messgae: error.details[0].message}):next();
    }
    changeStatus = (req:Request,res:Response,next:NextFunction)=>{
        const schema :joi.ObjectSchema = joi.object({
            session_id:joi.required(),
            status:joi.string().valid('accept', 'reject').required()
        })
        const options:any= {
            errors: {
                wrap: {
                    label: false
                }
            },
            stripUnknown: true
        };
        const {error}  = schema.validate(req.body,options);

        (error)? res.status(200).json({code:0 , messgae: error.details[0].message}):next();
    }
    fileSystem = (req:Request,res:Response,next:NextFunction)=>{
        const schema :joi.ObjectSchema = joi.object({
            file_name: joi.string().pattern(/^.*\.txt$/) .required(),
            mode: joi.string().valid('r', 'r+', 'w', 'w+', 'a', 'a+').required()
        })
        const options:any= {
            errors: {
                wrap: {
                    label: false
                }
            },
            stripUnknown: true
        };
        const {error}  = schema.validate(req.body,options);

        (error)? res.status(200).json({code:0 , messgae: error.details[0].message}):next();
    }
}

const validation :Validation = new Validation();
export{validation};