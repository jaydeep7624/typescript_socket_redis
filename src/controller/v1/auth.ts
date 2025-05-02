import common from '@config/common';
import connection  from '@config/database';
import constant from '@config/constant';
import jwt from 'jsonwebtoken';
import path from 'path';
import moment from 'moment';
import fileManager from '@config/fileManager';
import { Request, Response} from 'express';
import { getClient } from '@redis';
import { RedisClientType } from 'redis';
import { QueryResult } from 'pg';
import adjustHelper from '@config/eventQueue';
const cryptolib: any = require('cryptlib');

interface userTypeReq extends Request {
    user_id:number;
} 
class Authentication {
    userListing = async (req:Request,res:Response)=>{
        try{
            const client: RedisClientType | null = getClient();
            const cachedUserDetails :any = await client?.get("userDetails");  
            if (cachedUserDetails) {
                console.log("✅ User details fetched from Redis");
                common.sendResponse(req, res, 1, { keyword: "rest_keyword_success", content: "" }, JSON.parse(cachedUserDetails));
            } 
            else{
                console.log("API called here......");
                let query :string=`select * from users u where u.is_active=true and is_verified=true`;
                let user_details :QueryResult =await connection.query(query,[]);
                await client?.set("userDetails", JSON.stringify(user_details.rows));
                common.sendResponse(req, res, 1, { keyword: "rest_keyword_sucess", content: "" }, user_details.rows);
            }
        }
        catch(error){
            console.log(error); 
            common.sendResponse(req, res, 0, { keyword: "rest_keyword_error", content: "" }, []);
        }
    }
    signup = async (req:Request,res:Response)=>{
        try{  
            let request :any = req.body;  
            let{name,email,mobile_number,password} :any =request;
            password= cryptolib.encrypt(password, process.env.KEY, process.env.IV);

            let email_unique_query :string =`select * from users where email=$1  and is_verified=true`;
            let result :QueryResult = await connection.query(email_unique_query, [email]);
            if(result.rowCount){
                common.sendResponse(req,res,0,{keyword:"rest_keyword_unique_email_error",content:""},[]);
            }
            else{
                let mobile_unique_query :string =`select * from users where mobile_number=$1`;
                let result :QueryResult =await connection.query(mobile_unique_query,[mobile_number]);
                if(result.rowCount){
                    common.sendResponse(req, res, 0, { keyword: "rest_keyword_unique_mobile_number_error", content: "" }, []);
                }
                else{
                    const otp:number =common.generateOtp();
                    
                    let filename :any=await common.uploadFile(req.file);                    
                    let insert_user_query :string=`insert into users (name,email,mobile_number , password,otp, is_verified,profile_image) values($1,$2,$3,$4,$5,$6,$7) RETURNING *`;  
                    let insert_data :QueryResult=await connection.query(insert_user_query,[name,email,mobile_number,password,otp,false,filename]);
                    const token :string = jwt.sign({user_id:insert_data.rows[0].id}, `${process.env.KEY}`,
                        { expiresIn: '5m' }
                    );
                    insert_data.rows[0].token=token;
                    insert_data.rows[0].profile_image=`${constant.BASE_URL}${insert_data.rows[0].profile_image}`;
                    console.log("Mail Send Karva valu functin Call Thayu");
                    adjustHelper.sendMailEventQueue({ 'eventName': "kyc_verification_successful", callbackParams: {}, "email":email});
                    console.log("Mail Send Karva valu function Puru thayu")
                    await common.sendResponse(req, res, 1, { keyword: "rest_keyword_user_register_sucess", content: "" }, insert_data.rows[0]);
                }
            }
        }
        catch(error){
            console.log(error); 
            common.sendResponse(req, res, 0, { keyword: "rest_keyword_error", content: "" }, []);
        }
    }
    login = async(req:Request,res:Response)=>{
        try{
            const request:any =req.body;   
            let {email ,password} :any =request;
            password= cryptolib.encrypt(password, process.env.KEY, process.env.IV);       
            let login_user_query :string =`select * from users where email=$1 and password=$2 and is_active=true and is_delete=false `;
            let user_details :QueryResult=await connection.query(login_user_query,[email,password]);
            
            if(user_details.rowCount){
                const token  :string = jwt.sign({user_id:user_details.rows[0].id}, `${process.env.KEY}`,
                    { expiresIn: '30m' }
                );
                console.log("Token :",token);
                user_details.rows[0].token=token;
                if(user_details.rows[0].is_verified){
                    common.sendResponse(req, res, 1, { keyword: "rest_keyword_login_sucess", content: "" }, user_details.rows[0]);
                }
                else{
                    common.sendResponse(req, res, 1, { keyword: "rest_keyword_login_sucess_but_otp_verification_pending", content: "" }, user_details.rows[0]);
                }
            }
            else{
                common.sendResponse(req, res, 0, { keyword: "rest_keyword_invalid_creadential", content: "" }, []);
            }
        }
        catch(error){   
            console.log(error); 
            common.sendResponse(req, res, 0, { keyword: "rest_keyword_error", content: "" }, []);
        }
    }
    verifyOtp = async(req:Request,res:Response) =>{
        try{
            const userReq :any= req as userTypeReq; 
            const request :any = userReq.body;
            request.user_id = userReq.user_id;
           
            
            let query :string =`select * from users where id=$1 and is_active=true and is_delete=false`;
            let get_user_details :QueryResult =await connection.query(query,[request.user_id]);

            if(get_user_details.rows[0].otp==request.otp){
                // Update User in db :
                let update_user_details :string = `UPDATE users SET otp = NULL, is_verified = true WHERE id = $1 returning *`;
                let update_user_data :QueryResult =await connection.query(update_user_details,[request.user_id]);
                // after Update chab=nge redis UserDetails Data : 
                const key :string = "userDetails";
                const client :any = getClient();
                let data :any = await client?.get("userDetails");  
                let users :any = data ? JSON.parse(data) : [];
                users.push(update_user_data.rows[0]);
                await client?.set(key, JSON.stringify(users));

                console.log("User added successfully!");
                common.sendResponse(req, res, 1, { keyword: "rest_keyword_otp_sucess", content: "" }, []);
            }
            else{
                common.sendResponse(req, res, 0, { keyword: "rest_keyword_otp_invalid", content: "" }, []);
            }    
        } 
        catch(error){
            console.log(error); 
            common.sendResponse(req, res, 0, { keyword: "rest_keyword_error", content: "" }, []);
        }
    }
    resendOtp = async (req:Request,res:Response)=>{
        try{
            const userReq :any = req as userTypeReq; 
            const request :any = userReq.body;
            request.user_id = userReq.user_id;
            const otp :number =common.generateOtp();
            let update_user_query :string =`update users set otp=$1 ,is_verified=false where id=$2 returning *`;
            let update_user_data :QueryResult =await connection.query(update_user_query,[otp,request.user_id]);
            common.sendResponse(req, res, 1, { keyword: "rest_keyword_otp_resend_sucess", content: "" }, update_user_data.rows[0]);
        }
        catch(error){
            console.log(error); 
            common.sendResponse(req, res, 0, { keyword: "rest_keyword_error", content: "" }, []);
        }
    }
    changePassword = async (req:Request,res:Response)=>{
        try {
            const userReq :any = req as userTypeReq;
            const request :any  = userReq.body;
            request.user_id = userReq.user_id;
            let get_user_details_query :string =`select * from users where id=$1 and is_active=true and is_delete=false`;
            let get_user_details :QueryResult =await connection.query(get_user_details_query,[request.user_id]);
            if(cryptolib.encrypt(request.old_password, process.env.KEY, process.env.IV)==get_user_details.rows[0].password){
                // if(request.old_password==get_user_details.rows[0].password){
                if(request.new_password==get_user_details.rows[0].password){
                    common.sendResponse(req, res, 0, { keyword: "rest_keyword_old_password_new_password_same", content: "" }, []);
                }
                else{
                    let new_password :string =cryptolib.encrypt(request.new_password, process.env.KEY, process.env.IV);
                    // let new_password=request.new_password;
                    let update_password_query :string =`update users set password=$1 where id=$2 returning *`;
                    let update_user_details :QueryResult =await connection.query(update_password_query,[new_password,request.user_id]);
                    common.sendResponse(req, res, 1, { keyword: "rest_keyword_password_change_sucess", content: "" }, update_user_details.rows[0])
                }
            }
            else{
                common.sendResponse(req, res, 0, { keyword: "rest_keyword_old_password_not_match", content: "" }, []);                  
            }
        } 
        catch (error) {
            console.log(error); 
            common.sendResponse(req, res, 0, { keyword: "rest_keyword_error", content: "" }, []);
        }
    }
    forgotPassword = async(req:Request,res:Response)=>{
        try{
            let request :any =req.body;
            let check_email_query :string =`select * from users where email=$1`;
            let user_details :QueryResult =await connection.query(check_email_query,[request.email]);
            if(user_details.rowCount){
                let random_token :string =await common.generateToken();
                let insert_forgot_password_token :string =`insert into tbl_forgot_password_token(email,token) VALUES($1,$2)`;

                await connection.query(insert_forgot_password_token,[request.email,random_token]);

                // Code For Send Email : 

                // template.forgot_password(user_details.rows[0], function(forgotPasswordForm){
                //     console.log("coming vback here");
                    
                //     common.sendEmail(request.email, "Forgot password form", forgotPasswordForm, function(isSend){
                //         if (isSend) {
                //             callback(1, {keyword : "rest_keywords_user_forgot_password_success", content : {}}, []);
                //         } else {
                //             callback(0, {keyword : "rest_keywords_user_forgot_password_failed", content : {}}, []);
                //         }
                //     })
                //    common.sendResponse(req,res,1,"rest_keywords_user_forgot_password_success",[]);  
                // })

                // Send Email End Here : 
                common.sendResponse(req, res, 1, { keyword: "rest_keywords_user_forgot_password_email_send_success", content: "" }, []);
            }
            else{
                common.sendResponse(req, res, 0, { keyword: "rest_keyword_email_not_exist", content: "" }, []);     
            }
        }
        catch(error){
            console.log(error); 
            common.sendResponse(req, res, 0, { keyword: "rest_keyword_error", content: "" }, []);
        }
    }
    bookSession = async (req:Request,res:Response)=>{
        try{
           
            const userReq :any = req as userTypeReq; // Explicit type assertion
            const request :any = userReq.body;
            request.user_id  = userReq.user_id;
            request.start_time=moment.utc(request.start_time).format("YYYY-MM-DD HH:mm:ss");
            request.end_time=moment.utc(request.end_time).format("YYYY-MM-DD HH:mm:ss");
            let user_available :boolean = await common.checkUserAvailable(request);
            if(user_available){
                common.sendResponse(req, res, 1, { keyword: "rest_keyword_user_session_alredy_booked", content: "" },[]);
            }
            else{ 
                let creator_available :boolean =await common.creatorAvailable(request);
                if(creator_available){
                    common.sendResponse(req, res, 0, { keyword: "rest_keyword_creator_alredy_booked", content: "" },[]);
                }
                else{
                    let book_session_query :string =`insert into user_session (user_id ,creator_id,start_time,end_time,status) values($1,$2,$3,$4,$5) returning id`;
                    let user_book_session :QueryResult = await connection.query(book_session_query,[request.user_id,request.creator_id,request.start_time,request.end_time,'pending']);
        
                    let session_booking_data :string =`select * ,start_time AT TIME ZONE 'UTC' AS start_time, 
                    end_time AT TIME ZONE 'UTC' AS end_time from user_session where id=$1`;
                    let book_session_data :QueryResult =await connection.query(session_booking_data,[user_book_session.rows[0].id]);
                    common.sendResponse(req, res, 1, { keyword: "rest_keyword_session_book_sucess", content: "" },user_book_session.rows[0]);
                }
            }
        }
        catch(error){
            console.log(error); 
            common.sendResponse(req, res, 0, { keyword: "rest_keyword_error", content: "" }, []);
        }
    }
    changestatus = async(req:Request,res:Response)=>{
        try{
            let request :any =req.body;
            let update_status_query :string  = `update user_session set status=$1 where id=$2 returning *`;
            await connection.query(update_status_query,[request.status,request.session_id]);
            common.sendResponse(req, res, 1, { keyword: "rest_keyword_status_change_sucess", content: "" }, []);
        }
        catch(error){
            console.log(error); 
            common.sendResponse(req, res, 0, { keyword: "rest_keyword_error", content: "" }, []);
        }
    }
    fileSystem = async(req:Request,res:Response)=>{
        let fd :any ;
        try{
            let request :any  = req.body;
            fd = await fileManager.openFile(`${request.file_name}`, `${request.mode}`);
            const content :any = await fileManager.readFile1(fd); 
            console.log("File Content:\n", content);
          
            let writeLine :string ="\nHello i am adding this new Line";
            await fileManager.writeFile(fd,writeLine);
          
            const content1 :any = await fileManager.readFile1(fd);
            console.log("File Content:\n", content1);
            // await fileManager.deleteFile(`${request.file_name}`);
            await fileManager.closeFile(fd);
            await common.sendResponse(req, res, 1, { keyword: "rest_keyword_sucess", content: "" },content1); 
           
        }
        catch(error){
            console.log(error); 
            if(fd){
                await fileManager.closeFile(fd);
            }
            common.sendResponse(req, res, 0, { keyword: "rest_keyword_error", content: "" },[]); 
        }
    }
    profile_image =(req:Request,res:Response)=>{
        const uploadPath :string = path.resolve(__dirname, "../../../utils/upload"); 
        let profile_image_url :string = uploadPath+"/"+req.params.id;
        res.sendFile(profile_image_url);
    }
}
const auth:Authentication = new Authentication();
export{auth};