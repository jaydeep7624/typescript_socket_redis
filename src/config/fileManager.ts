import fs from 'fs';
import path from 'path';
const filePath = path.join(__dirname, '../../utils/files');

class FileManager{
    mode: any;
    constructor(){
        this.mode = null;
    }
    readFile = async(fileName: any)=>{
        const buf = Buffer.alloc(1024);
        return await new Promise((resolve,reject) => { 
            fs.open(`${filePath}/${fileName}`, "r+", function (error: any, fd: any) {
                if (error) {
                    return reject(error);
                }
                fs.read(fd,buf,0,buf.length,0,function(error: any,bytes: number){
                    if(error){
                        return reject(error);
                    }
                    if(bytes>0){
                        return  resolve(buf.subarray(0, bytes).toString());
                    }
                })
            });
        }) 
    }
    openFile = async (fileName: string, mode = 'r+')=> {
        return new Promise((resolve, reject) => {
            fs.open(`${filePath}/${fileName}`, mode, (err: any, fd: any) => {
                if (err) {
                    return reject(`Error opening file: ${err}`);
                }
                this.mode = mode;
                resolve(fd);
            });
        });
    }
    readFile1 = async (fd: any, bufferSize :number= 1024) =>{
        return new Promise((resolve, reject) => {
            const buf :Buffer= Buffer.alloc(bufferSize);
            fs.read(fd,buf,0,buf.length,0,function(error: any,bytes: number | undefined){
                if(error){
                    return reject(error);
                }
                return  resolve(buf.subarray(0, bytes).toString());
            })
        });
    }
    closeFile= async (fd: any)=> {
        return new Promise<void>((resolve, reject) => {
            fs.close(fd, (err: any) => {
                if (err) {
                    return reject(`Error closing file: ${err}`);
                }
                console.log("File closed successfully");
                resolve();
            });
        });
    }       
    writeFile =(fd: any, content: string) =>{
        const buf = Buffer.alloc(1024);

        return new Promise<void>((resolve, reject) => {
            if (this.mode === 'r') {
                return reject(new Error("You have only read permission."));
            }
            fs.write(fd, content, (error: any, writtenBytes: any) => {
                if (error) {    
                    return reject(error);
                }
                resolve();
            }); 
        });
    }
    deleteFile =(fileName: string)=>{
        return new Promise<void>((resolve , reject)=>{
            fs.unlink(`${filePath}/${fileName}`, function (error: any) {
                if (error) {
                    return reject(error);
                }
                console.log("File deleted successfully!");
                return resolve()
            });
        })
    }
}



const fileManager :FileManager = new FileManager;
export default fileManager;