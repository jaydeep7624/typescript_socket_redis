import fs from 'fs';
import path from 'path';
import connection from './database';
import { Request, Response } from 'express';
import { QueryResult } from 'pg';

class Common{
    sendResponse  = async (req:Request,res:Response,code:number, message:{ keyword: string,content:string }, data:any)=>{
        
        return res.status(200).json({
            code: code,
            message: message.keyword,
            data: data
        });
    } 

    generateOtp =()=>{
        return Number(Math.floor(1000 + Math.random() * 9000).toString());
    }  
    generateToken = async() => {
        const characters:string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token:string = '';
        for (let i = 0; i < 40; i++) {  
            const randomIndex:number = Math.floor(Math.random() * characters.length);
            token += characters[randomIndex];
        }
        return token;
    }


    checkUserAvailable = async(request: { user_id: number; start_time: any; end_time: any; })=>{
        try
        {
            let user_available_query :string = `select * from user_session us 
            where us.user_id=$1 and
            (
                (us.start_time<=$2 and us.end_time>=$3)
                or 
                (us.start_time<=$4 and us.end_time>=$5)
            ) and us.status !='reject'`;
            
            let user_available :QueryResult =await connection.query(user_available_query,[request.user_id,request.start_time,request.start_time,request.end_time,request.end_time]);
            if(user_available.rowCount){
                return true;
            }
            else{
                return false;
            }

        }
        catch(error){   
            throw error;
        }
    }

    creatorAvailable = async(request: { creator_id: number; start_time: any; end_time: any; })=>{
        try{
            let creator_available_query :string  = `select * from user_session us 
            where us.creator_id=$1 and
            (
                (us.start_time<=$2 and us.end_time>=$3)
                or 
                (us.start_time<=$4 and us.end_time>=$5)
            ) and us.status!='reject'`;
            
            let creator_available :QueryResult =await connection.query(creator_available_query,[request.creator_id,request.start_time,request.start_time,request.end_time,request.end_time]);
            console.log(creator_available.rows);
            if(creator_available.rowCount){
                return true;
            }
            else{
                return false;
            }
        }
        catch(error){
            throw error;
        }
    }
    uploadFile = async(request:any)=>{      
        const fileExtension :string   = path.extname(request.originalname); 
        const filename :string = Date.now() + fileExtension;
        const filePath :string  = path.join(__dirname, '../../utils/upload', filename);
        await new Promise<void>((resolve,reject)=>{
            fs.writeFile(filePath, request.buffer, (error) => {
                if (error) {
                    return reject(error) 
                }
                resolve();
            });
        })  
        return filename;
    }

   
}
const common:Common=new Common();
export default common;