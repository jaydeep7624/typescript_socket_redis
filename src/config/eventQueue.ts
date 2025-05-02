import  Queue  from "bull";
const adjustQueue = new Queue('adjustQueue', {
    redis: { host: "127.0.0.1", port: 6379}, // Redis connection
});

adjustQueue.on("error", (err) => {
    console.error("❌ Error connecting to Bull for Adjust ERROR_ADJUST_REDIS_BULL_CONNECTION:", err);
});

class AdjustHelper {
    public sendMailEventQueue = async (eventData: any) => {
        const  eventData1  = eventData;
        console.log(eventData1.email);
        console.log(`📧 Sending welcome email to  (${eventData1.email})`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
        console.log(`Email sent to ${eventData1.email}`);
    };
    
}
const adjustHelper = new AdjustHelper();
export default adjustHelper;