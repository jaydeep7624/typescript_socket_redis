import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
dotenv.config();
class Middleware{
    validateHeaderToken =(req:Request, res:Response, next:NextFunction) =>{
        const headerToken :any = req.headers['token'] ;
        console.log(req.path);     
        try {
            if(headerToken){
                const decoded :any= jwt.verify(headerToken, process.env.KEY!);
                (req as any).user_id = decoded.user_id;
                next()
            }
            else{
                res.status(401).send({
                    code: '0',
                    message: "Token is Required"
                });
            }
            
        } catch (error) {  
            res.status(401).send({
                code: '0',
                message: "Invalid Token"
            });
        }     
    }

    extractHeaderLanguage =(req:Request, res:Response ,next:NextFunction)=>{  
        
        var headerlang:string = (req.headers['accept-language'] !=undefined && req.headers['accept-language'] !="")? req.headers['accept-language'] :'en';
        (req as any).lang = headerlang;
        
        // localizify
        // .add('en',en)
        // .add('guj',guj)
        // .setLocale(headerlang);
        next(); 
    }
}

const validator :Middleware = new Middleware();
export{validator};