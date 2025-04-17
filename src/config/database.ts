import {Pool, QueryResult} from 'pg';
import dotenv from "dotenv";

dotenv.config();

class Database{
    private pool:Pool;
    constructor(){
            this.pool = new Pool({
            user: process.env.DATABASE_USER,        
            host: process.env.DATABASE_HOST,        
            database: process.env.DATABASE_NAME,    
            password: process.env.DATABASE_PASSWORD,
            port:Number(process.env.POSTGRE_DEFAULT_PORT)      
        });
        this.connection();
    }
    connection():void{
        this.pool.connect((err, client) => {
            if (err) {
              console.error('❌ Error connecting to the database', err.stack);
            } else {
                console.log('✅ Connected to the database successfully');
            }
        }); 
    }
    async query(text:string, params:any[]) {
        try {
            const result:QueryResult = await this.pool.query(text, params); 
            return result;
        } catch (err) {
            throw err;
        }
    }
}
const connection:Database=new Database(); 
export default connection;